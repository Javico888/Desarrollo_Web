/**
 * Clase principal para gestionar la lógica del contador.
 * Encapsula el estado y los métodos de actualización del DOM.
 */
class AplicacionContador {
    constructor() {
        // Propiedades de estado inicial
        this.conteo = 0;
        this.clicsIncremento = 0;
        this.clicsDecremento = 0;
        this.limiteClics = 10;

        // Referencias a elementos del DOM
        this.valorConteo = document.getElementById('valor-conteo');
        this.clicsIncrementoDisplay = document.getElementById('clics-incremento');
        this.clicsDecrementeDisplay = document.getElementById('clics-decremento');
        
        this.btnIncrementar = document.getElementById('btn-incrementar');
        this.btnDecrementar = document.getElementById('btn-decrementar');
        this.btnReiniciar = document.getElementById('btn-reiniciar');

        // Inicialización de eventos
        this.inicializar();
    }

    /**
     * Configura los escuchadores de eventos para los controles.
     */
    inicializar() {
        this.btnIncrementar.addEventListener('click', () => this.manejarIncremento());
        this.btnDecrementar.addEventListener('click', () => this.manejarDecremento());
        this.btnReiniciar.addEventListener('click', () => this.manejarReinicio());
        
        // Renderizado inicial
        this.actualizarInterfaz();
    }

    /**
     * Maneja la lógica de incremento y conteo de clics.
     */
    manejarIncremento() {
        this.conteo++;
        this.clicsIncremento++;
        this.verificarLimiteClics('incremento');
        this.actualizarInterfaz();
    }

    /**
     * Maneja la lógica de decremento y conteo de clics.
     */
    manejarDecremento() {
        this.conteo--;
        this.clicsDecremento++;
        this.verificarLimiteClics('decremento');
        this.actualizarInterfaz();
    }

    /**
     * Restablece el valor del contador y los contadores de clics.
     */
    manejarReinicio() {
        this.conteo = 0;
        this.clicsIncremento = 0;
        this.clicsDecremento = 0;
        this.actualizarInterfaz();
    }

    /**
     * Verifica si se alcanzó el límite de clics para reiniciar el conteo general.
     * @param {string} tipo - Tipo de acción ('incremento' o 'decremento').
     */
    verificarLimiteClics(tipo) {
        if (this.conteo === 10 || this.conteo === -10) {
            this.conteo = 0;
        }
    }

    /**
     * Actualiza los valores visibles en la interfaz de usuario.
     */
    actualizarInterfaz() {
        this.valorConteo.textContent = this.conteo;
        this.clicsIncrementoDisplay.textContent = this.clicsIncremento;
        this.clicsDecrementeDisplay.textContent = this.clicsDecremento;
    }
}

// Instanciación de la aplicación cuando el contenido DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    new AplicacionContador();
});