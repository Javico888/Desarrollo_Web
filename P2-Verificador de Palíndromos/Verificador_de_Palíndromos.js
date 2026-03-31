/**
 * Clase principal para gestionar la verificación de palíndromos.
 * Encapsula la lógica de validación y manipulación del DOM.
 */
class VerificadorPalindromos {
    constructor() {
        // Referencias a elementos del DOM
        this.entradaTexto = document.getElementById('entrada-texto');
        this.botonVerificar = document.getElementById('boton-verificar');
        this.contenedorResultado = document.getElementById('contenedor-resultado');
        this.mensajeResultado = this.contenedorResultado.querySelector('.mensaje');

        // Inicialización de eventos
        this.inicializar();
    }

    /**
     * Configura los escuchadores de eventos para los controles.
     */
    inicializar() {
        this.botonVerificar.addEventListener('click', () => this.manejarVerificacion());
        
        // Permitir verificación al presionar Enter
        this.entradaTexto.addEventListener('keypress', (evento) => {
            if (evento.key === 'Enter') {
                this.manejarVerificacion();
            }
        });
    }

    /**
     * Orquesta el proceso de validación y actualización de interfaz.
     */
    manejarVerificacion() {
        const textoOriginal = this.entradaTexto.value;
        
        // Validación básica de entrada vacía
        if (!textoOriginal.trim()) {
            this.actualizarInterfaz(false, 'Por favor, ingresa un texto.');
            return;
        }

        const textoLimpio = this.normalizarTexto(textoOriginal);
        const textoInvertido = this.invertirTexto(textoLimpio);
        const esPalindromo = textoLimpio === textoInvertido && textoLimpio.length > 0;

        if (esPalindromo) {
            this.actualizarInterfaz(true, `"${textoOriginal}" es un palíndromo.`);
        } else {
            this.actualizarInterfaz(false, `"${textoOriginal}" no es un palíndromo.`);
        }
    }

    /**
     * Normaliza el texto: minúsculas y solo caracteres alfanuméricos.
     * @param {string} texto - Texto crudo ingresado por el usuario.
     * @returns {string} - Texto limpio para comparación.
     */
    normalizarTexto(texto) {
        return texto
            .toLowerCase()
            .replace(/[^a-z0-9ñáéíóúü]/g, ''); 
            // Nota: La regex puede ajustarse según soporte de Unicode del entorno
    }

    /**
     * Invierte la cadena de caracteres proporcionada.
     * @param {string} texto - Texto normalizado.
     * @returns {string} - Texto invertido.
     */
    invertirTexto(texto) {
        return texto.split('').reverse().join('');
    }

    /**
     * Actualiza el estado visual del contenedor de resultados.
     * @param {boolean} esExito - Determina la clase de estilo a aplicar.
     * @param {string} mensaje - Texto a mostrar al usuario.
     */
    actualizarInterfaz(esExito, mensaje) {
        // Reset de clases previas
        this.contenedorResultado.classList.remove('exito', 'error', 'visible');
        
        // Forzar reflow para reiniciar animación CSS
        void this.contenedorResultado.offsetWidth;

        // Asignación de nuevas clases y contenido
        this.contenedorResultado.classList.add(esExito ? 'exito' : 'error', 'visible');
        this.mensajeResultado.textContent = mensaje;
    }
}

// Instanciación de la aplicación cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    new VerificadorPalindromos();
});