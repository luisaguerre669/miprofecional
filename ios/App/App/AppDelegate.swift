import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Configurar barra de estado para modo oscuro
        if #available(iOS 13.0, *) {
            window?.overrideUserInterfaceStyle = .unspecified
        }
        
        // Configurar notificaciones push (para futura implementación)
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
            if granted {
                DispatchQueue.main.async {
                    application.registerForRemoteNotifications()
                }
            }
        }
        
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Pausar tareas en segundo plano
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Limpiar caché sensible cuando entra en background
        URLCache.shared.removeAllCachedResponses()
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Refrescar UI al volver
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Reiniciar tareas pausadas
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Limpiar sesión temporal al cerrar
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Manejar deep links y OAuth callbacks (Google Sign-In)
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Universal Links para deep linking
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
    
    // Manejo de notificaciones push
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // Enviar token al backend para notificaciones
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        print("Push token: \(token)")
    }
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Failed to register for push: \(error.localizedDescription)")
    }

}
