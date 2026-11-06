package com.dashforge.cardash;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.util.Collections;
import java.util.List;

@CapacitorPlugin(name = "DashLauncher")
public class DashLauncherPlugin extends Plugin {

    @PluginMethod
    public void listApps(final PluginCall call) {
        new Thread(() -> {
            try {
                PackageManager pm = getContext().getPackageManager();
                Intent i = new Intent(Intent.ACTION_MAIN, null);
                i.addCategory(Intent.CATEGORY_LAUNCHER);
                List<ResolveInfo> list = pm.queryIntentActivities(i, 0);
                Collections.sort(list, new ResolveInfo.DisplayNameComparator(pm));
                JSArray arr = new JSArray();
                String self = getContext().getPackageName();
                for (ResolveInfo r : list) {
                    String pkg = r.activityInfo.packageName;
                    if (pkg.equals(self)) continue;
                    JSObject o = new JSObject();
                    o.put("name", r.loadLabel(pm).toString());
                    o.put("pkg", pkg);
                    o.put("icon", iconB64(r.loadIcon(pm)));
                    arr.put(o);
                }
                JSObject ret = new JSObject();
                ret.put("apps", arr);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        }).start();
    }

    private String iconB64(Drawable d) {
        try {
            int s = 96;
            Bitmap b = Bitmap.createBitmap(s, s, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(b);
            d.setBounds(0, 0, s, s);
            d.draw(c);
            ByteArrayOutputStream os = new ByteArrayOutputStream();
            b.compress(Bitmap.CompressFormat.PNG, 100, os);
            return "data:image/png;base64," + Base64.encodeToString(os.toByteArray(), Base64.NO_WRAP);
        } catch (Exception e) {
            return "";
        }
    }

    @PluginMethod
    public void launch(PluginCall call) {
        String pkg = call.getString("pkg");
        Intent i = pkg == null ? null : getContext().getPackageManager().getLaunchIntentForPackage(pkg);
        if (i == null) { call.reject("App not installed"); return; }
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }

    @PluginMethod
    public void homeSettings(PluginCall call) {
        try {
            Intent i = new Intent(android.provider.Settings.ACTION_HOME_SETTINGS);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Exception e) {
            Intent i = new Intent(android.provider.Settings.ACTION_SETTINGS);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        }
        call.resolve();
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        Intent i = new Intent(android.provider.Settings.ACTION_SETTINGS);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }
}
