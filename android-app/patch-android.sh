#!/usr/bin/env bash
# 在 `npx cap add android` 之後執行：
#  1. 把主畫面加上 FLAG_SECURE（系統級禁止截圖／錄影，最近工作縮圖也變黑，跟銀行 App 同一招）
#  2. App 名稱改成「JB2 數靈召喚師」
#  3. App 自己進入沉浸式全螢幕（隱藏狀態列／導覽列），鍵盤跳出時畫面跟著縮小
set -euo pipefail
JAVA=$(find android/app/src/main/java -name MainActivity.java | head -1)
PKG=$(grep -m1 '^package ' "$JAVA" | sed 's/package \(.*\);/\1/')
cat > "$JAVA" <<EOF
package $PKG;

import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 禁止截圖與錄影（測試時如果想截圖，可以把下面這行註解掉再重新打包）
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
        super.onCreate(savedInstanceState);
        hideSystemBars();
    }

    // App 自己進入「沉浸式全螢幕」：隱藏狀態列與導覽列，從螢幕邊緣滑一下才會暫時出現
    private void hideSystemBars() {
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (c == null) return;
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        c.hide(WindowInsetsCompat.Type.systemBars());
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }
}
EOF
sed -i 's#<string name="app_name">.*</string>#<string name="app_name">JB2 數靈召喚師</string>#; s#<string name="title_activity_main">.*</string>#<string name="title_activity_main">JB2 數靈召喚師</string>#' android/app/src/main/res/values/strings.xml
# 鍵盤跳出來時，畫面可視範圍跟著縮小（不然手機鍵盤會蓋住遊戲下半部）
MANIFEST=android/app/src/main/AndroidManifest.xml
if ! grep -q windowSoftInputMode "$MANIFEST"; then
  sed -i 's#<activity#<activity android:windowSoftInputMode="adjustResize"#' "$MANIFEST"
fi
echo "patched $JAVA"

