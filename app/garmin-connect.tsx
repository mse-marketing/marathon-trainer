/**
 * Garmin Connect WebView Screen.
 *
 * Laedt Garmin Connect im WebView. Falls nicht eingeloggt, wird automatisch
 * zu Garmin SSO weitergeleitet. Nach Login erscheint ein grosser "Senden" Button.
 * Der WebView dient nur zur Authentifizierung - das Workout wird via JS-Injection
 * (XMLHttpRequest) an die Garmin Connect REST API gesendet.
 *
 * Wichtig: fetch() in WKWebView sendet keine Session-Cookies mit (iOS Bug).
 * Daher wird XMLHttpRequest mit withCredentials=true und relativen URLs verwendet.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
  SafeAreaView, ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '../src/theme/colors';
import { Fonts } from '../src/theme/fonts';

const GARMIN_CONNECT_URL = 'https://connect.garmin.com/modern/workouts';

type Status = 'loading' | 'login' | 'verifying' | 'logged_in' | 'pushing' | 'success' | 'error';

interface SuccessInfo {
  workoutId: string | null;
  workoutName: string | null;
}

export default function GarminConnectScreen() {
  const { workoutJson, workoutName } = useLocalSearchParams<{
    workoutJson: string;
    workoutName: string;
  }>();
  const webViewRef = useRef<WebView>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [errorDetail, setErrorDetail] = useState('');
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const authRetryCount = useRef(0);

  // Timeout: if no response in 25 seconds, show error
  useEffect(() => {
    if (status === 'pushing') {
      timeoutRef.current = setTimeout(() => {
        setStatus('error');
        setErrorMsg('Zeitueberschreitung');
        setErrorDetail(
          'Garmin Connect hat nicht geantwortet. Moegliche Ursachen:\n' +
          '- Sitzung abgelaufen (schliessen & neu oeffnen)\n' +
          '- Garmin Server nicht erreichbar\n' +
          '- Langsame Internetverbindung',
        );
      }, 25000);
    } else if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [status]);

  // Verify authentication by making a simple GET request with XHR
  const verifyAuth = useCallback(() => {
    const script = `
      (function() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/modern/proxy/userprofile-service/userstats', true);
        xhr.withCredentials = true;
        xhr.timeout = 10000;
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'auth_check',
              authenticated: xhr.status >= 200 && xhr.status < 300,
              status: xhr.status,
              url: xhr.responseURL || '',
            }));
          }
        };
        xhr.send();
      })();
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  // Send workout using XMLHttpRequest (NOT fetch - fetch doesn't send cookies in WKWebView)
  const handleSendWorkout = useCallback(() => {
    if (!workoutJson) return;
    setStatus('pushing');
    setErrorMsg('');
    setErrorDetail('');

    const script = `
      (function() {
        try {
          var workout = ${workoutJson};
          var xhr = new XMLHttpRequest();
          xhr.open('POST', '/modern/proxy/workout-service/workout', true);
          xhr.withCredentials = true;
          xhr.timeout = 20000;
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.setRequestHeader('NK', 'NT');
          xhr.setRequestHeader('Accept', 'application/json, text/javascript, */*; q=0.01');
          xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

          xhr.onreadystatechange = function() {
            if (xhr.readyState !== 4) return;

            var text = xhr.responseText || '';
            var data = null;
            try { data = JSON.parse(text); } catch(e) {}

            var isHtml = text.trim().indexOf('<') === 0;
            var isOk = xhr.status >= 200 && xhr.status < 300;
            var workoutCreated = isOk && data && data.workoutId;
            var finalUrl = xhr.responseURL || '';
            var wasRedirected = finalUrl && finalUrl.indexOf('/modern/proxy/') === -1;

            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'workout_result',
              success: !!workoutCreated,
              status: xhr.status,
              statusText: xhr.statusText || '',
              workoutId: data ? (data.workoutId || null) : null,
              workoutName: data ? (data.workoutName || null) : null,
              responseUrl: finalUrl,
              responsePreview: text.substring(0, 500),
              error: !workoutCreated
                ? (wasRedirected ? 'Redirect erkannt (Sitzung abgelaufen). URL: ' + finalUrl
                  : xhr.status === 0 ? 'Keine Antwort vom Server (Timeout oder Netzwerkfehler)'
                  : isHtml ? 'HTML-Antwort statt JSON (Sitzung abgelaufen?)'
                  : data ? (data.message || data.errorMessage || 'Kein workoutId. Response: ' + JSON.stringify(data).substring(0, 200))
                  : 'Ungueltige Antwort: ' + text.substring(0, 200))
                : null,
            }));
          };

          xhr.ontimeout = function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'workout_result',
              success: false,
              status: 0,
              error: 'XHR Timeout - Server hat nicht innerhalb von 20 Sekunden geantwortet.',
            }));
          };

          xhr.send(JSON.stringify(workout));
        } catch(err) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'workout_result',
            success: false,
            status: 0,
            error: err.message || String(err),
          }));
        }
      })();
      true;
    `;

    webViewRef.current?.injectJavaScript(script);
  }, [workoutJson]);

  const handleNavigationChange = useCallback((event: { nativeEvent: { url: string } }) => {
    const url = event.nativeEvent.url || '';

    if (url.includes('sso.garmin.com')) {
      if (status !== 'login') setStatus('login');
    } else if (url.includes('connect.garmin.com/modern')) {
      if (status === 'loading' || status === 'login') {
        // Don't set logged_in immediately - wait for cookies to sync, then verify
        setStatus('verifying');
        authRetryCount.current = 0;
        setTimeout(() => verifyAuth(), 2000);
      }
    }
  }, [status, verifyAuth]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);

      // Handle auth verification result
      if (msg.type === 'auth_check') {
        if (msg.authenticated) {
          setStatus('logged_in');
        } else if (authRetryCount.current < 2) {
          // Cookies might not be synced yet - wait and retry
          authRetryCount.current += 1;
          setTimeout(() => verifyAuth(), 2000);
        } else {
          // After 3 attempts, reload the page to force cookie sync
          authRetryCount.current = 0;
          webViewRef.current?.reload();
        }
        return;
      }

      if (msg.type !== 'workout_result') return;

      if (msg.success) {
        setSuccessInfo({
          workoutId: msg.workoutId,
          workoutName: msg.workoutName,
        });
        setStatus('success');
      } else {
        setStatus('error');

        if (msg.status === 401 || msg.status === 403) {
          setErrorMsg('Sitzung abgelaufen (HTTP ' + msg.status + ')');
          setErrorDetail('Bitte schliesse diesen Screen und oeffne ihn erneut.');
        } else if (msg.status === 302 || (msg.responseUrl && !msg.responseUrl.includes('/proxy/'))) {
          setErrorMsg('Sitzung abgelaufen');
          setErrorDetail(msg.error || 'Du wurdest zur Login-Seite umgeleitet.');
        } else if (msg.status === 0) {
          setErrorMsg('Netzwerkfehler');
          setErrorDetail(msg.error || 'Die Anfrage konnte nicht gesendet werden.');
        } else {
          setErrorMsg('HTTP ' + msg.status + ' ' + (msg.statusText || ''));
          setErrorDetail(msg.error || msg.responsePreview || 'Unbekannter Fehler');
        }
      }
    } catch {
      // Ignore non-JSON messages from WebView
    }
  }, [verifyAuth]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Garmin Connect</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Login hint bar */}
      {status === 'login' && (
        <View style={styles.hint}>
          <Ionicons name="lock-closed-outline" size={14} color={Colors.accent} />
          <Text style={styles.hintText}>
            Logge dich mit deinem Garmin-Account ein
          </Text>
        </View>
      )}

      {/* WebView (hidden behind overlay when logged in) */}
      <View style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          source={{ uri: GARMIN_CONNECT_URL }}
          style={styles.webView}
          onLoadEnd={handleNavigationChange}
          onNavigationStateChange={(navState) => {
            handleNavigationChange({ nativeEvent: { url: navState.url } });
          }}
          onMessage={handleMessage}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.loadingText}>Garmin Connect wird geladen...</Text>
            </View>
          )}
          onError={() => {
            setStatus('error');
            setErrorMsg('Verbindungsfehler');
            setErrorDetail('Keine Internetverbindung oder Garmin nicht erreichbar.');
          }}
        />

        {/* Overlay: Verifying auth */}
        {status === 'verifying' && (
          <View style={styles.overlay}>
            <View style={styles.card}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.cardTitle}>Sitzung wird geprueft...</Text>
              <Text style={styles.cardSubtitle}>Cookies werden synchronisiert.</Text>
            </View>
          </View>
        )}

        {/* Overlay: Logged in -> Show send button */}
        {status === 'logged_in' && (
          <View style={styles.overlay}>
            <View style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="watch-outline" size={40} color={Colors.accent} />
              </View>
              <Text style={styles.cardTitle}>Bereit zum Senden</Text>
              <Text style={styles.cardSubtitle}>
                {workoutName || 'Workout'} wird an deinen{'\n'}Garmin Connect Account gesendet.
              </Text>
              <TouchableOpacity onPress={handleSendWorkout} activeOpacity={0.85}>
                <LinearGradient
                  colors={[Colors.accentGradientStart, Colors.accentGradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sendButton}
                >
                  <Ionicons name="cloud-upload-outline" size={22} color={Colors.textOnAccent} />
                  <Text style={styles.sendButtonText}>Workout senden</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.cardHint}>
                Nach dem Senden: Garmin-Uhr syncen{'\n'}und Workout unter "Training" starten.
              </Text>
            </View>
          </View>
        )}

        {/* Overlay: Pushing */}
        {status === 'pushing' && (
          <View style={styles.overlay}>
            <View style={styles.card}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.cardTitle}>Wird gesendet...</Text>
              <Text style={styles.cardSubtitle}>Workout wird an Garmin Connect uebertragen.</Text>
            </View>
          </View>
        )}

        {/* Overlay: Success */}
        {status === 'success' && (
          <View style={styles.overlay}>
            <View style={styles.card}>
              <View style={[styles.cardIcon, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
                <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
              </View>
              <Text style={[styles.cardTitle, { color: Colors.success }]}>Gesendet!</Text>
              <Text style={styles.cardSubtitle}>
                {successInfo?.workoutName
                  ? `"${successInfo.workoutName}" wurde erfolgreich erstellt.`
                  : 'Das Workout wurde erfolgreich an Garmin Connect gesendet.'}
                {'\n\n'}Synce jetzt deine Garmin-Uhr, dann findest du das Workout unter "Training".
              </Text>
              {successInfo?.workoutId && (
                <Text style={styles.debugText}>Workout-ID: {successInfo.workoutId}</Text>
              )}
              <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
                <Text style={styles.doneButtonText}>Zurueck zum Workout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Overlay: Error */}
        {status === 'error' && (
          <View style={styles.overlay}>
            <ScrollView
              contentContainerStyle={styles.overlayScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.card}>
                <View style={[styles.cardIcon, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                  <Ionicons name="alert-circle" size={48} color="#EF4444" />
                </View>
                <Text style={[styles.cardTitle, { color: '#EF4444' }]}>{errorMsg || 'Fehler'}</Text>
                {errorDetail ? (
                  <Text style={styles.cardSubtitle}>{errorDetail}</Text>
                ) : null}
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setStatus('logged_in');
                    setErrorMsg('');
                    setErrorDetail('');
                  }}
                >
                  <Text style={styles.retryButtonText}>Nochmal versuchen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reloadButton}
                  onPress={() => {
                    setStatus('loading');
                    setErrorMsg('');
                    setErrorDetail('');
                    webViewRef.current?.reload();
                  }}
                >
                  <Text style={styles.reloadButtonText}>Seite neu laden</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelLink} onPress={() => router.back()}>
                  <Text style={styles.cancelLinkText}>Abbrechen</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    fontSize: 17, fontWeight: '600', color: Colors.textPrimary,
    fontFamily: Fonts.displaySemiBold,
  },
  hint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.accentMuted, paddingHorizontal: 16, paddingVertical: 10,
  },
  hintText: { fontSize: 13, color: Colors.accentLight, fontFamily: Fonts.bodyRegular },
  webView: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', gap: 16,
  },
  loadingText: { fontSize: 14, color: Colors.textSecondary, fontFamily: Fonts.bodyRegular },

  // Overlays
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    justifyContent: 'center', alignItems: 'center',
    padding: 24,
  },
  overlayScroll: {
    flexGrow: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: Radius.lg,
    padding: 32, alignItems: 'center',
    width: '100%', maxWidth: 360,
  },
  cardIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.accentMuted,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22, fontWeight: '700', color: Colors.textPrimary,
    fontFamily: Fonts.displayBold, marginBottom: 8, textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14, color: Colors.textSecondary, textAlign: 'center',
    lineHeight: 21, fontFamily: Fonts.bodyRegular, marginBottom: 24,
  },
  cardHint: {
    fontSize: 12, color: Colors.textTertiary, textAlign: 'center',
    lineHeight: 18, fontFamily: Fonts.bodyRegular, marginTop: 16,
  },
  debugText: {
    fontSize: 11, color: Colors.textTertiary, fontFamily: Fonts.monoRegular,
    marginBottom: 16,
  },
  sendButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: Radius.full, paddingVertical: 16, paddingHorizontal: 40,
  },
  sendButtonText: {
    fontSize: 17, fontWeight: '700', color: Colors.textOnAccent,
    fontFamily: Fonts.displayBold,
  },
  doneButton: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.success,
    borderRadius: Radius.full, paddingVertical: 14, paddingHorizontal: 32,
  },
  doneButtonText: {
    fontSize: 15, fontWeight: '600', color: Colors.success,
    fontFamily: Fonts.displaySemiBold,
  },
  retryButton: {
    backgroundColor: Colors.accent, borderRadius: Radius.full,
    paddingVertical: 14, paddingHorizontal: 32,
  },
  retryButtonText: {
    fontSize: 15, fontWeight: '600', color: Colors.textOnAccent,
    fontFamily: Fonts.displaySemiBold,
  },
  reloadButton: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder,
    borderRadius: Radius.full, paddingVertical: 14, paddingHorizontal: 32,
    marginTop: 10,
  },
  reloadButtonText: {
    fontSize: 15, fontWeight: '600', color: Colors.textSecondary,
    fontFamily: Fonts.displaySemiBold,
  },
  cancelLink: { marginTop: 16 },
  cancelLinkText: { fontSize: 14, color: Colors.textTertiary, fontFamily: Fonts.bodyRegular },
});
