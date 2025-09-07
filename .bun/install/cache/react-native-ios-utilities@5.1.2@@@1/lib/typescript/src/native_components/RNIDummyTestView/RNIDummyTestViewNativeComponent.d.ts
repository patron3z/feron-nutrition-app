import type { DirectEventHandler, BubblingEventHandler } from 'react-native/Libraries/Types/CodegenTypes';
import type { HostComponent, ViewProps } from 'react-native';
interface NativeProps extends ViewProps {
    someBool: string;
    someString: string;
    someStringOptional: string;
    someNumber: string;
    someNumberOptional: string;
    someObject: string;
    someObjectOptional: string;
    someArray: string;
    someArrayOptional: string;
    onSomeDirectEventWithEmptyPayload: DirectEventHandler<{}>;
    onSomeDirectEventWithObjectPayload: DirectEventHandler<{}>;
    onSomeBubblingEventWithEmptyPayload: BubblingEventHandler<{}>;
    onSomeBubblingEventWithObjectPayload: DirectEventHandler<{}>;
    onDidSetViewID: BubblingEventHandler<{}>;
}
declare const _default: HostComponent<NativeProps>;
export default _default;
//# sourceMappingURL=RNIDummyTestViewNativeComponent.d.ts.map