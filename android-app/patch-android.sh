#!/usr/bin/env bash
# 在 `npx cap add android` 之後執行：
#  1. 把主畫面加上 FLAG_SECURE（系統級禁止截圖／錄影，最近工作縮圖也變黑，跟銀行 App 同一招）
#  2. App 名稱改成「JB2 數靈召喚師」
set -euo pipefail
JAVA=$(find android/app/src/main/java -name MainActivity.java | head -1)
PKG=$(grep -m1 '^package ' "$JAVA" | sed 's/package \(.*\);/\1/')
cat > "$JAVA" <<EOF
package $PKG;

import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 禁止截圖與錄影（測試時如果想截圖，可以把下面這行註解掉再重新打包）
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
        super.onCreate(savedInstanceState);
    }
}
EOF
sed -i 's#<string name="app_name">.*</string>#<string name="app_name">JB2 數靈召喚師</string>#; s#<string name="title_activity_main">.*</string>#<string name="title_activity_main">JB2 數靈召喚師</string>#' android/app/src/main/res/values/strings.xml
echo "patched $JAVA"
