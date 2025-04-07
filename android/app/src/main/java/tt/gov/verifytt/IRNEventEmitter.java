package tt.gov.verifytt;

import com.facebook.react.bridge.WritableMap;

import kotlin.Unit;

public interface IRNEventEmitter {
    Unit emitEvent(WritableMap eventMap);
}