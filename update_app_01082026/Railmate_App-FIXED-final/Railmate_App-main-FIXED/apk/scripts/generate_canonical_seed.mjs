import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readJson,
  resolveDaysOfWeek,
  sqlBoolean,
  sqlDate,
  sqlIntArray,
  sqlQuote,
  sqlTime,
  toCanonicalFareClass,
  toCanonicalTrainType,
  unwrapCollection,
} from './canonical-seed-utils.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(rootDir, 'data');
const supabaseDir = path.join(rootDir, 'supabase');

const stationsPayload = readJson(path.join(dataDir, 'stations.json'));
const trainsPayload = readJson(path.join(dataDir, 'trains_fixed.json'));
const stopsPayload = readJson(path.join(dataDir, 'train_stops_fixed.json'));
const faresPayload = readJson(path.join(dataDir, 'fares_fixed.json'));

const stations = unwrapCollection(stationsPayload, 'stations');
const trains = unwrapCollection(trainsPayload, 'trains');
const stops = unwrapCollection(stopsPayload, 'train_stops');
const fares = unwrapCollection(faresPayload, 'fares');

const cityToStation = new Map(stations.map((station) => [station.shohoz_city, station]));
const stationCodeToStation = new Map(stations.map((station) => [station.code, station]));

function stationUuid(code) {
  return `uuid_generate_v5(uuid_ns_url(), 'station:${code}')`;
}

function trainUuid(number) {
  return `uuid_generate_v5(uuid_ns_url(), 'train:${number}')`;
}

function fareUuid(index) {
  return `uuid_generate_v5(uuid_ns_url(), 'fare:${index}')`;
}

function stopUuid(trainNumber, sequence) {
  return `uuid_generate_v5(uuid_ns_url(), 'stop:${trainNumber}:${sequence}')`;
}

function trainNameEn(train) {
  return train.name_en ?? train.name;
}

function trainNameBn(train) {
  return train.name_bn ?? train.name_en ?? train.name;
}

function trainOriginCity(train) {
  return train.origin_city ?? train.origin;
}

function trainDestinationCity(train) {
  return train.destination_city ?? train.destination;
}

function trainTypeValue(train) {
  return train.type ?? train.train_type;
}

function buildStationRows() {
  return stations.map((station) => [
    stationUuid(station.code),
    sqlQuote(station.code),
    sqlQuote(station.name_en),
    sqlQuote(station.name_bn),
    sqlQuote(station.division),
    sqlQuote(station.zone),
    station.lat ?? 'NULL',
    station.lng ?? 'NULL',
    sqlBoolean(Boolean(station.is_intercity_hub)),
    'true',
    'NOW()',
  ].join(', '));
}

function buildTrainRows() {
  return trains.map((train) => {
    const originCity = trainOriginCity(train);
    const destinationCity = trainDestinationCity(train);
    const originStation = cityToStation.get(originCity);
    const destinationStation = cityToStation.get(destinationCity);

    if (!originStation || !destinationStation) {
      throw new Error(`Train ${train.number} references unknown route ${originCity} -> ${destinationCity}`);
    }

    const nameEn = trainNameEn(train);
    const nameBn = trainNameBn(train);
    if (!nameEn) {
      throw new Error(`Train ${train.number} has no resolvable name_en — refusing to write NULL into a NOT NULL column.`);
    }
    if (!nameBn) {
      throw new Error(`Train ${train.number} has no resolvable name_bn — refusing to write NULL into a NOT NULL column.`);
    }

    return [
      trainUuid(train.number),
      sqlQuote(String(train.number)),
      sqlQuote(nameEn),
      sqlQuote(nameBn),
      sqlQuote(toCanonicalTrainType(trainTypeValue(train))),
      stationUuid(originStation.code),
      stationUuid(destinationStation.code),
      sqlIntArray(resolveDaysOfWeek(train)),
      'true',
      sqlQuote(train.note ?? null),
      sqlDate(train.last_verified ?? trainsPayload?._meta?.last_verified ?? null),
      'NOW()',
      'NOW()',
    ].join(', ');
  });
}

function buildStopRows() {
  return stops.map((stop) => {
    const station = stationCodeToStation.get(stop.station_code);
    if (!station) {
      throw new Error(`Stop ${stop.train_number}/${stop.stop_sequence} references unknown station ${stop.station_code}`);
    }

    return [
      stopUuid(stop.train_number, stop.stop_sequence),
      trainUuid(stop.train_number),
      stationUuid(station.code),
      stop.stop_sequence,
      sqlTime(stop.arrive_time),
      sqlTime(stop.depart_time),
      0,
      sqlBoolean(Boolean(stop.is_origin || stop.is_destination)),
    ].join(', ');
  });
}

function buildFareRows() {
  return fares.map((fare, index) => {
    const fromStation = cityToStation.get(fare.from_city);
    const toStation = cityToStation.get(fare.to_city);

    if (!fromStation || !toStation) {
      throw new Error(`Fare ${fare.from_city} -> ${fare.to_city} references unknown stations`);
    }

    const totalFare =
      Number(fare.base_fare ?? 0) +
      Number(fare.vat_amount ?? 0) +
      Number(fare.online_charge ?? 0);

    return [
      fareUuid(index + 1),
      'NULL',
      stationUuid(fromStation.code),
      stationUuid(toStation.code),
      sqlQuote(toCanonicalFareClass(fare.seat_class_code)),
      Math.round(totalFare),
      sqlDate(fare.last_verified ?? faresPayload?._meta?.last_verified ?? stationsPayload?._meta?.last_verified ?? null),
      'NOW()',
    ].join(', ');
  });
}

const output = `-- ============================================================
-- RailMate Bangladesh — Canonical UUID Seed
-- Generated from local project data by scripts/generate_canonical_seed.mjs
-- Source files: data/stations.json, data/trains_fixed.json,
--               data/train_stops_fixed.json, data/fares_fixed.json
-- ============================================================

INSERT INTO stations (
  id,
  code,
  name_en,
  name_bn,
  division,
  zone,
  latitude,
  longitude,
  is_major,
  is_active,
  created_at
) VALUES
${buildStationRows().map((row) => `  (${row})`).join(',\n')};

INSERT INTO trains (
  id,
  number,
  name_en,
  name_bn,
  type,
  origin_id,
  destination_id,
  days_of_week,
  is_active,
  notes,
  last_verified,
  created_at,
  updated_at
) VALUES
${buildTrainRows().map((row) => `  (${row})`).join(',\n')};

INSERT INTO train_stops (
  id,
  train_id,
  station_id,
  sequence,
  arrival_time,
  departure_time,
  halt_minutes,
  is_major_stop
) VALUES
${buildStopRows().map((row) => `  (${row})`).join(',\n')};

INSERT INTO fares (
  id,
  train_id,
  from_station_id,
  to_station_id,
  class,
  price_bdt,
  last_verified,
  created_at
) VALUES
${buildFareRows().map((row) => `  (${row})`).join(',\n')};
`;

mkdirSync(supabaseDir, { recursive: true });
writeFileSync(path.join(supabaseDir, 'seed.sql'), output);

console.warn(
  JSON.stringify(
    {
      stations: stations.length,
      trains: trains.length,
      stops: stops.length,
      fares: fares.length,
    },
    null,
    2,
  ),
);
