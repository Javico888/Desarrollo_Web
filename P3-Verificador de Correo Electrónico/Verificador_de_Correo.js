class ValidadorCorreo {
    constructor() {
        // Expresión regular estándar para validación de email
        this.patronEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Referencias a elementos del DOM
        this.formulario = document.getElementById('formulario-email');
        this.campoEmail = document.getElementById('campo-email');
        this.mensajeValidacion = document.getElementById('mensaje-validacion');
        this.botonValidar = document.getElementById('boton-validar');
        this.textoBoton = this.botonValidar.querySelector('.texto-boton');

        // Estado de validación
        this.esValido = false;

        // Inicialización de eventos
        this.inicializar();
    }

    /**
     * Configura los escuchadores de eventos para los controles.
     */
    inicializar() {
        // Validación en tiempo real mientras el usuario escribe
        this.campoEmail.addEventListener('input', () => this.manejarEntrada());
        
        // Validación al perder el foco
        this.campoEmail.addEventListener('blur', () => this.manejarEntrada());

        // Manejo del envío del formulario
        this.formulario.addEventListener('submit', (evento) => this.manejarEnvio(evento));
    }

    /**
     * Orquesta el proceso de validación en tiempo real con retroalimentación visual.
     */
    manejarEntrada() {
        const valorEmail = this.campoEmail.value.trim();
        
        // Limpiar estados previos si el campo está vacío
        if (!valorEmail) {
            this.limpiarEstados();
            this.botonValidar.disabled = true;
            return;
        }

        // Validación inmediata con retroalimentación visual
        this.esValido = this.validarFormato(valorEmail);
        this.actualizarRetroalimentacionVisual(this.esValido);
        this.botonValidar.disabled = false;
    }

    /**
     * Previene el envío predeterminado y simula proceso de validación.
     * @param {Event} evento - Objeto de evento del submit.
     */
    manejarEnvio(evento) {
        evento.preventDefault();
        
        const valorEmail = this.campoEmail.value.trim();
        
        // Iniciar estado de carga
        this.iniciarCarga();

        // Simular tiempo de procesamiento (1.5 segundos)
        setTimeout(() => {
            this.finalizarCarga();
            
            // Mantener retroalimentación visual del input
            this.actualizarRetroalimentacionVisual(this.esValido);
            
            // Mostrar mensaje final según resultado
            if (this.esValido) {
                this.mostrarMensajeFinal('Correo Validado', 'exito');
            } else {
                this.mostrarMensajeFinal('No se Puede Validar su Correo', 'error');
            }
        }, 1500);
    }

    /**
     * Evalúa el string contra la expresión regular almacenada.
     * @param {string} email - Texto a validar.
     * @returns {boolean} - Resultado de la validación.
     */
    validarFormato(email) {
        return this.patronEmail.test(email);
    }

    /**
     * Actualiza la retroalimentación visual del input (borde, icono, aria).
     * @param {boolean} esValido - Estado de la validación.
     */
    actualizarRetroalimentacionVisual(esValido) {
        // Remover clases previas
        this.campoEmail.classList.remove('valido', 'invalido');
        
        // Forzar reflow para reiniciar animaciones CSS
        void this.campoEmail.offsetWidth;

        if (esValido) {
            this.campoEmail.classList.add('valido');
            this.campoEmail.setAttribute('aria-invalid', 'false');
        } else {
            this.campoEmail.classList.add('invalido');
            this.campoEmail.setAttribute('aria-invalid', 'true');
        }
    }

    /**
     * Activa el estado visual de carga en el botón.
     */
    iniciarCarga() {
        this.botonValidar.classList.add('cargando');
        this.botonValidar.disabled = true;
        this.textoBoton.textContent = 'Validando...';
    }

    /**
     * Desactiva el estado visual de carga en el botón.
     */
    finalizarCarga() {
        this.botonValidar.classList.remove('cargando');
        this.botonValidar.disabled = false;
        this.textoBoton.textContent = 'Validar Ahora';
    }

    /**
     * Muestra mensaje final después de la simulación de carga.
     * @param {string} texto - Mensaje a mostrar.
     * @param {string} tipo - Tipo de mensaje ('exito' o 'error').
     */
    mostrarMensajeFinal(texto, tipo) {
        this.mensajeValidacion.classList.remove('exito', 'error', 'visible');
        void this.mensajeValidacion.offsetWidth;

        this.mensajeValidacion.textContent = texto;
        this.mensajeValidacion.classList.add(tipo, 'visible');
    }

    /**
     * Restablece los estilos a su estado inicial.
     */
    limpiarEstados() {
        this.campoEmail.classList.remove('valido', 'invalido');
        this.mensajeValidacion.classList.remove('exito', 'error', 'visible');
        this.mensajeValidacion.textContent = '';
        this.campoEmail.setAttribute('aria-invalid', 'false');
        this.esValido = false;
    }
}

// Instanciación de la aplicación cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    new ValidadorCorreo();
});