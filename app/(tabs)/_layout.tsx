import { Stack } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    // Tabs 컴포넌트 대신 Stack 컴포넌트를 사용합니다.
    <Stack>
      {/* 
        Stack.Screen을 사용하여 'index' 화면만 단독으로 렌더링합니다.
        options={{ headerShown: false }}를 통해 상단 헤더(제목 표시줄)를 숨깁니다.
      */}
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      {/* 
        'explore' 화면에 대한 정의를 제거했으므로 더 이상 나타나지 않습니다.
      */}
    </Stack>
  );
}
