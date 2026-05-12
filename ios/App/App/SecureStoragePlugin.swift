import Foundation
import Capacitor

/**
 * SecureStoragePlugin - Bridge entre JavaScript y Keychain iOS
 */
@objc(SecureStoragePlugin)
public class SecureStoragePlugin: CAPPlugin {
    
    private let storage = SecureStorage.shared
    
    @objc func setItem(_ call: CAPPluginCall) {
        guard let key = call.getString("key"),
              let value = call.getString("value") else {
            call.reject("KEY_AND_VALUE_REQUIRED")
            return
        }
        
        let success = storage.saveToKeychain(key: key, value: value)
        
        if success {
            call.resolve(["success": true])
        } else {
            call.reject("SAVE_FAILED")
        }
    }
    
    @objc func getItem(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("KEY_REQUIRED")
            return
        }
        
        if let value = storage.getFromKeychain(key: key) {
            call.resolve(["value": value])
        } else {
            call.resolve(["value": NSNull()])
        }
    }
    
    @objc func removeItem(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("KEY_REQUIRED")
            return
        }
        
        storage.deleteFromKeychain(key: key)
        call.resolve(["success": true])
    }
    
    @objc func clear(_ call: CAPPluginCall) {
        storage.clearAllSessions()
        call.resolve(["success": true])
    }
}

// Extension para exponer métodos privados al plugin
extension SecureStorage {
    func saveToKeychain(key: String, value: String) -> Bool {
        guard let data = value.data(using: .utf8) else { return false }
        
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(deleteQuery as CFDictionary)
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }
    
    func getFromKeychain(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            return nil
        }
        
        return value
    }
    
    func deleteFromKeychain(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
    }
}
