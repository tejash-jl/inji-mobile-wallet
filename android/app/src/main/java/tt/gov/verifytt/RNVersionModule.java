
package tt.gov.verifytt;

import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import tt.gov.verifytt.BuildConfig;



public class RNVersionModule extends ReactContextBaseJavaModule {

    private static final String NAME = "VersionModule";

    @ReactMethod(isBlockingSynchronousMethod = true)
    public String getVersion() {
        return BuildConfig.TUVALI_LIB_VERSION;
    }

    @Override
    public String getName() {
        return NAME;
    }
}


