import React from 'react';
import { Button, View, StyleSheet, BackHandler, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Enhanced script to disable text selection, copy, and long-press actions
const disableSelectionAndCopyScript = `
(function() {
  // Disable text selection
  document.documentElement.style.userSelect = 'none';
  document.documentElement.style.webkitUserSelect = 'none';
  document.documentElement.style.mozUserSelect = 'none';
  document.documentElement.style.msUserSelect = 'none';
  
  // Disable context menu (right-click menu)
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  }, false);
  
  // Disable copy
  document.addEventListener('copy', function(e) {
    e.preventDefault();
    return false;
  }, false);
  
  // Disable cut
  document.addEventListener('cut', function(e) {
    e.preventDefault();
    return false;
  }, false);
  
  // Disable paste
  document.addEventListener('paste', function(e) {
    e.preventDefault();
    return false;
  }, false);
  
  // Disable long-press popup on mobile
  document.addEventListener('touchstart', function(e) {
    // This prevents the long-press from activating
    // We're using a short timeout to distinguish between taps and long-presses
    const target = e.target;
    target.longPressTimeout = setTimeout(function() {
      target.longPressActive = true;
    }, 500);
  }, true);
  
  document.addEventListener('touchend', function(e) {
    // Clean up the timeout
    const target = e.target;
    if (target.longPressTimeout) {
      clearTimeout(target.longPressTimeout);
      target.longPressActive = false;
    }
  }, true);
  
  document.addEventListener('touchmove', function(e) {
    // If the user moves their finger, it's not a long-press
    const target = e.target;
    if (target.longPressTimeout) {
      clearTimeout(target.longPressTimeout);
      target.longPressActive = false;
    }
  }, true);
  
  // Prevent selection popups
  document.addEventListener('selectionchange', function(e) {
    if (window.getSelection) {
      if (window.getSelection().empty) {
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {
        window.getSelection().removeAllRanges();
      }
    }
  }, false);
})();
true;
`;

// WebView Screen Component
const WebViewScreen = ({ navigation }: any) => {
  let webViewRef: WebView | null = null;
  let canGoBack = false;

  // Handle back button press for WebView
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (canGoBack && webViewRef) {
          webViewRef.goBack();
          return true; // Prevent default behavior (app exit)
        }
        return false; // Let default behavior happen (navigate to previous screen or exit app)
      };

      // Add event listener
      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      // Return cleanup function
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [canGoBack])
  );

  return (
    <View style={styles.container}>
      
      <WebView
        ref={(ref) => (webViewRef = ref)}
        source={{ uri: 'https://student-payment-manager.vercel.app/' }}
        style={styles.webview}
        injectedJavaScript={disableSelectionAndCopyScript}
        onNavigationStateChange={(navState) => {
          canGoBack = navState.canGoBack;
        }}
        // Disable built-in WebView selection capabilities
        textInteractionWithFormattedText={false}
        // Apply these additional props to further restrict selection
        selectTextOnLongPress={false}
        contextMenuDisabled={true}
      />
      {/* <Button
        title="Go to Another Screen"
        onPress={() => navigation.navigate('AnotherScreen')}
      /> */}
      

    </View>
  );
};

// Another Screen Component
const AnotherScreen = ({ navigation }: any) => {
  // Handle back button press for regular screens
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.goBack();
        return true; // Prevent default behavior (app exit)
      };

      // Add event listener
      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      // Return cleanup function
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [navigation])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.noSelect}>This text cannot be selected</Text>
      <Button title="Back to WebView" onPress={() => navigation.goBack()} />
    </View>
  );
};

// Stack Navigator Setup
const Stack = createStackNavigator();

// Export the navigator components instead of wrapping in NavigationContainer
const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="WebView">
      <Stack.Screen name="WebView" component={WebViewScreen} 
      options={{ headerShown: false }} // Hides the header title
      />
      <Stack.Screen name="AnotherScreen" component={AnotherScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30, 
    userSelect: 'none' as 'none',
  },
  webview: {
    flex: 1,
    
  },
  noSelect: {
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
    userSelect: 'none' as 'none',
  }
});

export default AppNavigator;