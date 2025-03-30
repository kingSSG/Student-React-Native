import React, { useState } from 'react';
import { Button, View, StyleSheet, BackHandler, Text, KeyboardAvoidingView, Platform } from 'react-native';
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
    // Skip for input fields to allow normal keyboard behavior
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      return true;
    }
    
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
  
  // Prevent selection popups, but not for input fields
  document.addEventListener('selectionchange', function(e) {
    if (window.getSelection) {
      const selection = window.getSelection();
      const activeEl = document.activeElement;
      
      // Allow selection in input fields and textareas
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
        return true;
      }
      
      if (selection.empty) {
        selection.empty();
      } else if (selection.removeAllRanges) {
        selection.removeAllRanges();
      }
    }
  }, false);

  // Fix for iOS to ensure inputs are focusable
  document.addEventListener('click', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      e.target.focus();
    }
  }, false);
})();
true;
`;

// WebView Screen Component
const WebViewScreen = ({ navigation }: any) => {
  let webViewRef: WebView | null = null;
  let canGoBack = false;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

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

  // Script to detect keyboard visibility
  const keyboardDetectionScript = `
    window.addEventListener('focus', function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'keyboardVisible', value: true}));
      }
    }, true);
    
    window.addEventListener('blur', function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'keyboardVisible', value: false}));
      }
    }, true);
  `;

  // Handle messages from WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'keyboardVisible') {
        setKeyboardVisible(data.value);
      }
    } catch (error) {
      console.log('Error parsing WebView message:', error);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <WebView
        ref={(ref) => (webViewRef = ref)}
        source={{ uri: 'https://student-payment-manager.vercel.app/' }}
        style={styles.webview}
        injectedJavaScript={disableSelectionAndCopyScript + keyboardDetectionScript}
        onNavigationStateChange={(navState) => {
          canGoBack = navState.canGoBack;
        }}
        onMessage={handleWebViewMessage}
        
        // Allow keyboard to open for inputs but still disable selection elsewhere
        textInteractionWithFormattedText={true}
        selectTextOnLongPress={false}
        contextMenuDisabled={false}
        keyboardDisplayRequiresUserAction={false} // Important for iOS to allow focusing inputs
        
        // These settings help with form inputs
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={true}
        
        // Make sure JS is enabled
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </KeyboardAvoidingView>
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