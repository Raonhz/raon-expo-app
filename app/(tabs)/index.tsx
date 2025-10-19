import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  BackHandler,
  ActivityIndicator,
  View,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

// --- 푸시 알림을 위한 import 추가 ---
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
// --- 여기까지 ---

// 푸시 알림 기본 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// 푸시 토큰을 받아오는 함수
async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("푸시 알림을 받으려면 알림 권한을 허용해주세요.");
      return;
    }
    // Expo 프로젝트 ID를 사용하여 토큰을 가져옵니다.
    token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas.projectId,
      })
    ).data;
    console.log("Expo Push Token:", token);
  } else {
    alert("푸시 알림은 실제 기기에서만 작동합니다.");
  }

  return token;
}

// 로딩 인디케이터 (이전과 동일)
const LoadingIndicator = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
  </View>
);

export default function WebViewScreen() {
  const webviewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const ANDROID_USER_AGENT =
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36";

  // --- 앱 시작 시 푸시 알림 권한 요청 및 토큰 전송 ---
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        // 받아온 토큰을 내 서버로 전송합니다.
        // 실제로는 사용자가 로그인했을 때 등 특정 시점에 보내는 것이 좋습니다.
        fetch("https://raondr.com/api/save-push-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: token,
            // userId: '...', // 사용자가 로그인했다면 userId도 함께 보냅니다.
          }),
        }).catch((error) => console.error("Failed to send push token:", error));
      }
    });
  }, []);
  // --- 여기까지 ---

  // 안드로이드 뒤로가기 버튼 처리 (이전과 동일)
  useEffect(() => {
    if (Platform.OS === "android") {
      const handleBackButton = () => {
        if (webviewRef.current && canGoBack) {
          webviewRef.current.goBack();
          return true;
        }
        return false;
      };
      const backHandlerSubscription = BackHandler.addEventListener(
        "hardwareBackPress",
        handleBackButton
      );
      return () => {
        backHandlerSubscription.remove();
      };
    }
  }, [canGoBack]);

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ uri: "https://raondr.com" }}
        style={styles.webview}
        // --- User-Agent 속성 추가 ---
        // 안드로이드에서 실행될 때, User-Agent 값을 모바일 크롬 브라우저인 것처럼 설정합니다.
        userAgent={Platform.OS === "android" ? ANDROID_USER_AGENT : undefined}
        startInLoadingState={true}
        renderLoading={() => <LoadingIndicator />}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsBackForwardNavigationGestures={true}
        // onShouldStartLoadWithRequest는 일단 제거하여 User-Agent 효과를 확인합니다.
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
