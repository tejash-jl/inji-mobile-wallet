package inji.utils;

import java.io.IOException;

public class AndroidUtil {

    public static void invokeAppFromBackGroundAndroid() {
        try {
            ProcessBuilder processBuilder;
            String osName = System.getProperty("os.name");
            if (osName.contains("Windows")) {
                processBuilder = new ProcessBuilder("cmd.exe", "/c", "adb shell am start -n tt.gov.verifytt/tt.gov.verifytt.MainActivity");

            } else {
                processBuilder = new ProcessBuilder("/bin/bash", "-c", "adb shell am start -n tt.gov.verifytt/tt.gov.verifytt.MainActivity");
            }
            processBuilder.redirectErrorStream(true);
            processBuilder.start();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static void enableAirplaneMode() {
        try {
            ProcessBuilder processBuilder;
            String osName = System.getProperty("os.name");
            if (osName.contains("Windows")) {
                processBuilder = new ProcessBuilder("cmd.exe", "/c", "adb shell cmd connectivity airplane-mode enable");

            } else {
                processBuilder = new ProcessBuilder("/bin/bash", "-c", "adb shell cmd connectivity airplane-mode enable");
            }
            processBuilder.redirectErrorStream(true);
            processBuilder.start();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static void disableBluetooth() {
        try {
            ProcessBuilder processBuilder;
            String osName = System.getProperty("os.name");
            if (osName.contains("Windows")) {
                processBuilder = new ProcessBuilder("cmd.exe", "/c", "adb shell cmd bluetooth_manager disable");

            } else {
                processBuilder = new ProcessBuilder("/bin/bash", "-c", "adb shell cmd bluetooth_manager disable");
            }
            processBuilder.redirectErrorStream(true);
            processBuilder.start();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static void forceStopApp() {
        try {
            ProcessBuilder processBuilder;
            String osName = System.getProperty("os.name");
            if (osName.contains("Windows")) {
                processBuilder = new ProcessBuilder("cmd.exe", "/c", "adb shell am force-stop tt.gov.verifytt");

            } else {
                processBuilder = new ProcessBuilder("/bin/bash", "-c", "adb shell am force-stop tt.gov.verifytt");
            }
            processBuilder.redirectErrorStream(true);
            processBuilder.start();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public static void disableAirplaneMode() {
        try {
            ProcessBuilder processBuilder;
            String osName = System.getProperty("os.name");
            if (osName.contains("Windows")) {
                processBuilder = new ProcessBuilder("cmd.exe", "/c", "adb shell cmd connectivity airplane-mode disable");

            } else {
                processBuilder = new ProcessBuilder("/bin/bash\", \"-c\", \"adb shell cmd connectivity airplane-mode disable");
            }
            processBuilder.redirectErrorStream(true);
            processBuilder.start();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}