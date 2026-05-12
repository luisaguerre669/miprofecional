import Foundation
import Security

/**
 * SecureStorage - Gestión segura de tokens y datos sensibles en iOS
 * Usa Keychain para almacenamiento encriptado
 */
class SecureStorage {
    static let shared = SecureStorage()
    private init() {}
    
    // MARK: - Keys
    private enum Keys {
        static let accessToken = "com.miprofesional.accessToken"
        static let refreshToken = "com.miprofesional.refreshToken"
        static let userId = "com.miprofesional.userId"
        static let userEmail = "com.miprofesional.userEmail"
        static let lastLogin = "com.miprofesional.lastLogin"
    }
    
    // MARK: - Keychain Operations
    
    private func saveToKeychain(key: String, value: String) -> Bool {
        guard let data = value.data(using: .utf8) else { return false }
        
        // Eliminar valor existente
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(deleteQuery as CFDictionary)
        
        // Insertar nuevo valor
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }
    
    private func getFromKeychain(key: String) -> String? {
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
    
    private func deleteFromKeychain(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
    }
    
    // MARK: - Public API
    
    func saveAccessToken(_ token: String) {
        _ = saveToKeychain(key: Keys.accessToken, value: token)
    }
    
    func getAccessToken() -> String? {
        return getFromKeychain(key: Keys.accessToken)
    }
    
    func saveRefreshToken(_ token: String) {
        _ = saveToKeychain(key: Keys.refreshToken, value: token)
    }
    
    func getRefreshToken() -> String? {
        return getFromKeychain(key: Keys.refreshToken)
    }
    
    func saveUserSession(userId: String, email: String) {
        _ = saveToKeychain(key: Keys.userId, value: userId)
        _ = saveToKeychain(key: Keys.userEmail, value: email)
        _ = saveToKeychain(key: Keys.lastLogin, value: ISO8601DateFormatter().string(from: Date()))
    }
    
    func getUserId() -> String? {
        return getFromKeychain(key: Keys.userId)
    }
    
    func getUserEmail() -> String? {
        return getFromKeychain(key: Keys.userEmail)
    }
    
    func clearAllSessions() {
        deleteFromKeychain(key: Keys.accessToken)
        deleteFromKeychain(key: Keys.refreshToken)
        deleteFromKeychain(key: Keys.userId)
        deleteFromKeychain(key: Keys.userEmail)
        deleteFromKeychain(key: Keys.lastLogin)
    }
    
    func isSessionValid() -> Bool {
        guard let token = getAccessToken(), !token.isEmpty else {
            return false
        }
        return true
    }
}
