import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Sentry } from '../lib/sentry';

interface State { hasError: boolean; }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  // getDerivedStateFromError only updates state for the fallback UI — it
  // can't do side effects. Reporting has to happen here instead, or every
  // caught crash was invisible outside whoever was holding the phone.
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  handleReset = () => {
    this.setState({ hasError: false });
    try { router.replace('/(tabs)'); } catch { /* ignore */ }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={s.container}>
          <Text style={s.emoji}>🚂</Text>
          <Text style={s.title}>কিছু একটা সমস্যা হয়েছে</Text>
          <Text style={s.body}>অ্যাপটি পুনরায় চালু করুন।</Text>
          <TouchableOpacity style={s.btn} onPress={this.handleReset}>
            <Text style={s.btnText}>আবার চেষ্টা করুন</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0D13', alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji:     { fontSize: 48, marginBottom: 16 },
  title:     { fontSize: 20, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  body:      { fontSize: 14, color: '#94A0AB', textAlign: 'center', marginBottom: 32 },
  btn:       { backgroundColor: '#26C96A', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  btnText:   { fontSize: 15, fontWeight: '700', color: '#0A0D13' },
});
