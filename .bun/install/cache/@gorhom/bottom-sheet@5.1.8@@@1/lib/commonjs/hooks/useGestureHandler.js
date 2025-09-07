"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useGestureHandler = void 0;
var _react = require("react");
var _reactNativeGestureHandler = require("react-native-gesture-handler");
var _constants = require("../constants");
const useGestureHandler = (source, state, gestureSource, onStart, onChange, onEnd, onFinalize) => {
  const handleOnStart = (0, _react.useCallback)(event => {
    'worklet';

    state.value = _reactNativeGestureHandler.State.BEGAN;
    gestureSource.value = source;
    onStart(source, event);
    return;
  }, [state, gestureSource, source, onStart]);
  const handleOnChange = (0, _react.useCallback)(event => {
    'worklet';

    if (gestureSource.value !== source) {
      return;
    }
    state.value = event.state;
    onChange(source, event);
  }, [state, gestureSource, source, onChange]);
  const handleOnEnd = (0, _react.useCallback)(event => {
    'worklet';

    if (gestureSource.value !== source) {
      return;
    }
    state.value = event.state;
    gestureSource.value = _constants.GESTURE_SOURCE.UNDETERMINED;
    onEnd(source, event);
  }, [state, gestureSource, source, onEnd]);
  const handleOnFinalize = (0, _react.useCallback)(event => {
    'worklet';

    if (gestureSource.value !== source) {
      return;
    }
    state.value = event.state;
    gestureSource.value = _constants.GESTURE_SOURCE.UNDETERMINED;
    onFinalize(source, event);
  }, [state, gestureSource, source, onFinalize]);
  return {
    handleOnStart,
    handleOnChange,
    handleOnEnd,
    handleOnFinalize
  };
};
exports.useGestureHandler = useGestureHandler;
//# sourceMappingURL=useGestureHandler.js.map