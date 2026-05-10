const express = require('express');
const router = express.Router();

/**
 * GET /legal/terms
 * Endpoint público para consultar los términos y condiciones de MiProfesional
 * No requiere autenticación
 */
router.get('/terms', (req, res) => {
  try {
    const currentDate = new Date();
    
    // Términos y condiciones de MiProfesional
    const termsAndConditions = {
      title: "Términos y Condiciones de Uso",
      version: "1.0",
      lastUpdated: currentDate.toISOString(),
      content: `
# Términos y Condiciones de Uso - MiProfesional

## 1. Aceptación de los Términos

Al acceder y utilizar la plataforma MiProfesional, usted acepta y está de acuerdo con estos Términos y Condiciones de Uso. Si no está de acuerdo con estos términos, no debe utilizar la plataforma.

## 2. Descripción del Servicio

MiProfesional es una plataforma tecnológica que actúa como intermediaria para conectar usuarios con profesionales independientes que ofrecen diversos servicios. No somos una empresa de servicios profesionales, sino una plataforma que facilita la conexión entre partes.

## 3. Responsabilidades

### 3.1. Responsabilidad de los Usuarios
- Proporcionar información veraz y actualizada
- Respetar los derechos de los profesionales
- Realizar los pagos acordados por los servicios
- Cumplir con las condiciones acordadas

### 3.2. Responsabilidad de los Profesionales
- Ofrecer servicios profesionales de calidad
- Cumplir con la normativa aplicable a su profesión
- Respetar los derechos de los usuarios
- Mantener actualizada su información profesional

### 3.3. Responsabilidad de MiProfesional
- Actuar como plataforma intermediaria
- Facilitar la comunicación entre usuarios y profesionales
- Mantener la seguridad y funcionalidad de la plataforma
- No somos responsables de la calidad de los servicios prestados

## 4. Pagos y Transacciones

MiProfesional facilita el procesamiento de pagos entre usuarios y profesionales. La plataforma actúa como intermediaria en las transacciones financieras, pero no es responsable de disputas relacionadas con la calidad de los servicios.

## 5. Privacidad y Protección de Datos

Nos comprometemos a proteger la privacidad de nuestros usuarios de acuerdo con la legislación vigente. Los datos personales serán utilizados exclusivamente para los fines establecidos en nuestra Política de Privacidad.

## 6. Propiedad Intelectual

Todo el contenido de la plataforma MiProfesional, incluyendo但不限于 el diseño, texto, gráficos, logos, es propiedad de MiProfesional y está protegido por las leyes de propiedad intelectual.

## 7. Limitación de Responsabilidad

MiProfesional no es responsable de:
- La calidad de los servicios prestados por los profesionales
- Disputas entre usuarios y profesionales
- Pérdidas indirectas o consecuentes
- Interrupciones temporales del servicio

## 8. Modificación de los Términos

MiProfesional se reserva el derecho de modificar estos términos en cualquier momento. Las modificaciones entrarán en vigor desde su publicación en la plataforma.

## 9. Terminación del Servicio

MiProfesional se reserva el derecho de suspender o terminar el acceso a la plataforma en caso de incumplimiento de estos términos.

## 10. Ley Aplicable

Estos términos se rigen por las leyes de la República Argentina. Cualquier disputa será resuelta por los tribunales competentes.

## 11. Contacto

Para cualquier consulta sobre estos términos, puede contactarnos a través de:
- Email: legal@miprofesional.com
- Teléfono: +54 9 11 XXXX-XXXX

---

**Fecha de última actualización:** ${currentDate.toLocaleDateString('es-AR', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

**Versión:** 1.0

Al utilizar MiProfesional, usted reconoce que ha leído, entendido y aceptado estos términos y condiciones.
      `.trim()
    };

    res.status(200).json({
      success: true,
      data: termsAndConditions
    });

  } catch (error) {
    console.error('❌ Error getting terms and conditions:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los términos y condiciones'
    });
  }
});

/**
 * GET /legal/privacy
 * Endpoint público para consultar la política de privacidad
 */
router.get('/privacy', (req, res) => {
  try {
    const currentDate = new Date();
    
    const privacyPolicy = {
      title: "Política de Privacidad",
      version: "1.0",
      lastUpdated: currentDate.toISOString(),
      content: `
# Política de Privacidad - MiProfesional

## 1. Información que Recopilamos

Recopilamos información personal que nos proporciona voluntariamente al registrarse y utilizar nuestra plataforma, incluyendo但不限于:
- Nombre completo
- Dirección de correo electrónico
- Número de teléfono
- Ubicación
- Información profesional (para profesionales)

## 2. Uso de la Información

Utilizamos su información para:
- Facilitar el acceso a la plataforma
- Conectarlo con profesionales adecuados
- Procesar pagos y transacciones
- Mejorar nuestros servicios
- Comunicarnos con usted

## 3. Compartir Información

No compartimos su información personal con terceros, excepto:
- Cuando es necesario para facilitar servicios
- Cuando requerimos por ley
- Con su consentimiento explícito

## 4. Seguridad

Implementamos medidas de seguridad razonables para proteger su información personal contra acceso no autorizado.

## 5. Sus Derechos

Usted tiene derecho a:
- Acceder a su información personal
- Corregir información incorrecta
- Eliminar su cuenta e información
- Oponerse al procesamiento de sus datos

## 6. Cookies

Utilizamos cookies para mejorar la experiencia del usuario y analizar el uso de la plataforma.

## 7. Contacto

Para consultas sobre privacidad: privacy@miprofesional.com
      `.trim()
    };

    res.status(200).json({
      success: true,
      data: privacyPolicy
    });

  } catch (error) {
    console.error('❌ Error getting privacy policy:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la política de privacidad'
    });
  }
});

module.exports = router;
