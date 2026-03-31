/**
 * Clase principal para gestionar la tabla de elementos.
 * Encapsula la lógica de CRUD, filtrado, ordenamiento y validación.
 */
class GestorTabla {
    constructor() {
        // Estructura de datos principal (Array de objetos)
        this.elementos = [];
        this.elementoEdicion = null;
        this.ordenActual = { campo: 'nombre', direccion: 'asc' };

        // Referencias a elementos del DOM
        this.formulario = document.getElementById('formulario-elemento');
        this.campoId = document.getElementById('campo-id');
        this.campoNombre = document.getElementById('campo-nombre');
        this.campoCategoria = document.getElementById('campo-categoria');
        this.campoAnio = document.getElementById('campo-anio');
        this.botonGuardar = document.getElementById('boton-guardar');
        this.botonCancelar = document.getElementById('boton-cancelar');
        this.campoBusqueda = document.getElementById('campo-busqueda');
        this.filtroCategoria = document.getElementById('filtro-categoria');
        this.filtroOrden = document.getElementById('filtro-orden');
        this.cuerpoTabla = document.getElementById('cuerpo-tabla');
        this.mensajeVacio = document.getElementById('mensaje-vacio');
        this.contadorElementos = document.getElementById('contador-elementos');

        // Inicialización
        this.inicializar();
        this.cargarDatosEjemplo();
    }

    /**
     * Configura los escuchadores de eventos para los controles.
     */
    inicializar() {
        // Evento de envío del formulario
        this.formulario.addEventListener('submit', (evento) => this.manejarEnvioFormulario(evento));
        
        // Evento de cancelación de edición
        this.botonCancelar.addEventListener('click', () => this.cancelarEdicion());
        
        // Evento de búsqueda en tiempo real
        this.campoBusqueda.addEventListener('input', () => this.aplicarFiltros());
        
        // Evento de filtro por categoría
        this.filtroCategoria.addEventListener('change', () => this.aplicarFiltros());
        
        // Evento de ordenamiento
        this.filtroOrden.addEventListener('change', () => this.aplicarOrdenamiento());
        
        // Delegación de eventos para botones de acción en la tabla
        this.cuerpoTabla.addEventListener('click', (evento) => this.manejarAccionesTabla(evento));
        
        // Ordenamiento por encabezados de tabla
        document.querySelectorAll('.tabla th.ordenable').forEach(encabezado => {
            encabezado.addEventListener('click', () => this.ordenarPorEncabezado(encabezado));
        });

        // Validación en tiempo real de campos
        this.campoNombre.addEventListener('blur', () => this.validarCampo(this.campoNombre));
        this.campoCategoria.addEventListener('change', () => this.validarCampo(this.campoCategoria));
        this.campoAnio.addEventListener('blur', () => this.validarCampo(this.campoAnio));
    }

    /**
     * Carga datos de ejemplo para demostración inicial.
     */
    cargarDatosEjemplo() {
        this.renderizarTabla();
    }

    /**
     * Maneja el envío del formulario (crear o actualizar).
     * @param {Event} evento - Objeto de evento del submit.
     */
    manejarEnvioFormulario(evento) {
        evento.preventDefault();

        try {
            // Validar todos los campos
            if (!this.validarFormulario()) {
                throw new Error('Por favor, corrige los errores en el formulario.');
            }

            // Obtener valores del formulario
            const datos = {
                id: this.campoId.value ? parseInt(this.campoId.value) : Date.now(),
                nombre: this.campoNombre.value.trim(),
                categoria: this.campoCategoria.value,
                anio: parseInt(this.campoAnio.value)
            };

            // Crear o actualizar elemento
            if (this.elementoEdicion) {
                this.actualizarElemento(datos);
            } else {
                this.crearElemento(datos);
            }

            // Limpiar formulario y actualizar tabla
            this.limpiarFormulario();
            this.aplicarFiltros();

        } catch (error) {
            console.error('Error en formulario:', error.message);
            this.mostrarMensajeGlobal(error.message, 'error');
        }
    }

    /**
     * Crea un nuevo elemento en la estructura de datos.
     * @param {Object} datos - Datos del nuevo elemento.
     */
    crearElemento(datos) {
        this.elementos.push(datos);
        this.mostrarMensajeGlobal('Elemento añadido correctamente.', 'exito');
    }

    /**
     * Actualiza un elemento existente en la estructura de datos.
     * @param {Object} datos - Datos actualizados del elemento.
     */
    actualizarElemento(datos) {
        const indice = this.elementos.findIndex(elem => elem.id === datos.id);
        
        if (indice !== -1) {
            this.elementos[indice] = datos;
            this.elementoEdicion = null;
            this.mostrarMensajeGlobal('Elemento actualizado correctamente.', 'exito');
        }
    }

    /**
     * Elimina un elemento de la estructura de datos.
     * @param {number} id - ID del elemento a eliminar.
     */
    eliminarElemento(id) {
        try {
            const confirmacion = confirm('¿Estás seguro de que deseas eliminar este elemento?');
            
            if (!confirmacion) {
                return;
            }

            this.elementos = this.elementos.filter(elem => elem.id !== id);
            this.aplicarFiltros();
            this.mostrarMensajeGlobal('Elemento eliminado correctamente.', 'exito');

        } catch (error) {
            console.error('Error al eliminar:', error.message);
            this.mostrarMensajeGlobal('Error al eliminar el elemento.', 'error');
        }
    }

    /**
     * Prepara el formulario para editar un elemento.
     * @param {number} id - ID del elemento a editar.
     */
    prepararEdicion(id) {
        const elemento = this.elementos.find(elem => elem.id === id);
        
        if (!elemento) {
            return;
        }

        this.elementoEdicion = id;
        this.campoId.value = elemento.id;
        this.campoNombre.value = elemento.nombre;
        this.campoCategoria.value = elemento.categoria;
        this.campoAnio.value = elemento.anio;

        this.botonGuardar.textContent = 'Actualizar Elemento';
        this.botonCancelar.style.display = 'flex';
        this.formulario.scrollIntoView({ behavior: 'smooth' });

        // Resaltar fila en edición
        document.querySelectorAll('.tabla tbody tr').forEach(fila => {
            fila.classList.remove('edicion');
            if (parseInt(fila.dataset.id) === id) {
                fila.classList.add('edicion');
            }
        });
    }

    /**
     * Cancela el proceso de edición y limpia el formulario.
     */
    cancelarEdicion() {
        this.elementoEdicion = null;
        this.limpiarFormulario();
        document.querySelectorAll('.tabla tbody tr').forEach(fila => {
            fila.classList.remove('edicion');
        });
    }

    /**
     * Valida un campo individual del formulario.
     * @param {HTMLElement} campo - Elemento input a validar.
     * @returns {boolean} - Resultado de la validación.
     */
    validarCampo(campo) {
        const mensajeError = campo.parentElement.querySelector('.mensaje-error');
        let esValido = true;
        let mensaje = '';

        switch (campo.id) {
            case 'campo-nombre':
                if (!campo.value.trim()) {
                    esValido = false;
                    mensaje = 'El nombre es requerido.';
                } else if (campo.value.trim().length < 2) {
                    esValido = false;
                    mensaje = 'El nombre debe tener al menos 2 caracteres.';
                }
                break;

            case 'campo-categoria':
                if (!campo.value) {
                    esValido = false;
                    mensaje = 'Selecciona una categoría.';
                }
                break;

            case 'campo-anio':
                const anio = parseInt(campo.value);
                if (!campo.value) {
                    esValido = false;
                    mensaje = 'El año es requerido.';
                } else if (isNaN(anio) || anio < 1900 || anio > 2099) {
                    esValido = false;
                    mensaje = 'Ingresa un año válido (1900-2099).';
                }
                break;
        }

        // Actualizar estado visual del campo
        campo.classList.toggle('error', !esValido);
        mensajeError.textContent = mensaje;
        mensajeError.classList.toggle('visible', !esValido);

        return esValido;
    }

    /**
     * Valida todos los campos del formulario.
     * @returns {boolean} - Resultado de la validación completa.
     */
    validarFormulario() {
        const campos = [this.campoNombre, this.campoCategoria, this.campoAnio];
        let esValido = true;

        campos.forEach(campo => {
            if (!this.validarCampo(campo)) {
                esValido = false;
            }
        });

        return esValido;
    }

    /**
     * Aplica filtros de búsqueda y categoría a los datos.
     */
    aplicarFiltros() {
        const terminoBusqueda = this.campoBusqueda.value.toLowerCase().trim();
        const categoriaFiltro = this.filtroCategoria.value;

        // Filtrar elementos (método filter de Array - Funciones y eventos.pdf)
        let elementosFiltrados = this.elementos.filter(elemento => {
            const coincideBusqueda = 
                elemento.nombre.toLowerCase().includes(terminoBusqueda) ||
                elemento.categoria.toLowerCase().includes(terminoBusqueda) ||
                elemento.anio.toString().includes(terminoBusqueda);
            
            const coincideCategoria = !categoriaFiltro || elemento.categoria === categoriaFiltro;

            return coincideBusqueda && coincideCategoria;
        });

        // Aplicar ordenamiento actual
        elementosFiltrados = this.ordenarElementos(elementosFiltrados);

        // Renderizar resultados
        this.renderizarTabla(elementosFiltrados);
    }

    /**
     * Aplica el ordenamiento seleccionado desde el dropdown.
     */
    aplicarOrdenamiento() {
        const valorOrden = this.filtroOrden.value;
        const [campo, direccion] = valorOrden.split('-');
        
        this.ordenActual = { campo, direccion };
        this.aplicarFiltros();

        // Actualizar iconos de encabezados
        document.querySelectorAll('.tabla th.ordenable').forEach(th => {
            th.classList.remove('orden-asc', 'orden-desc');
            if (th.dataset.orden === campo) {
                th.classList.add(`orden-${direccion}`);
            }
        });
    }

    /**
     * Ordena elementos por clic en encabezado de tabla.
     * @param {HTMLElement} encabezado - Elemento th clickeado.
     */
    ordenarPorEncabezado(encabezado) {
        const campo = encabezado.dataset.orden;
        
        // Alternar dirección si es el mismo campo
        if (this.ordenActual.campo === campo) {
            this.ordenActual.direccion = this.ordenActual.direccion === 'asc' ? 'desc' : 'asc';
        } else {
            this.ordenActual.campo = campo;
            this.ordenActual.direccion = 'asc';
        }

        // Actualizar select de ordenamiento
        this.filtroOrden.value = `${campo}-${this.ordenActual.direccion}`;
        this.aplicarOrdenamiento();
    }

    /**
     * Ordena el array de elementos según criterios establecidos.
     * @param {Array} elementos - Array a ordenar.
     * @returns {Array} - Array ordenado.
     */
    ordenarElementos(elementos) {
        const { campo, direccion } = this.ordenActual;

        // Método sort de Array (Funciones y eventos.pdf)
        return [...elementos].sort((a, b) => {
            let valorA = a[campo];
            let valorB = b[campo];

            // Normalizar valores para comparación
            if (typeof valorA === 'string') {
                valorA = valorA.toLowerCase();
                valorB = valorB.toLowerCase();
            }

            let comparacion = 0;
            if (valorA < valorB) comparacion = -1;
            if (valorA > valorB) comparacion = 1;

            return direccion === 'asc' ? comparacion : -comparacion;
        });
    }

    /**
     * Renderiza la tabla con los elementos proporcionados.
     * @param {Array} elementos - Array de elementos a renderizar.
     */
    renderizarTabla(elementos = null) {
        const elementosMostrar = elementos || this.ordenarElementos(this.elementos);

        // Limpiar cuerpo de tabla
        this.cuerpoTabla.innerHTML = '';

        // Mostrar u ocultar mensaje de vacío
        if (elementosMostrar.length === 0) {
            this.mensajeVacio.style.display = 'block';
            this.contadorElementos.textContent = '0 elementos';
            return;
        }

        this.mensajeVacio.style.display = 'none';

        // Renderizar filas (método forEach de Array)
        elementosMostrar.forEach(elemento => {
            const fila = this.crearFilaTabla(elemento);
            this.cuerpoTabla.appendChild(fila);
        });

        // Actualizar contador
        this.contadorElementos.textContent = `${elementosMostrar.length} elemento(s)`;
    }

    /**
     * Crea un elemento tr para la tabla.
     * @param {Object} elemento - Datos del elemento.
     * @returns {HTMLElement} - Elemento tr creado.
     */
    crearFilaTabla(elemento) {
        const fila = document.createElement('tr');
        fila.dataset.id = elemento.id;

        fila.innerHTML = `
            <td>${this.escaparHTML(elemento.nombre)}</td>
            <td><span class="etiqueta-categoria">${this.escaparHTML(elemento.categoria)}</span></td>
            <td>${elemento.anio}</td>
            <td class="acciones">
                <button type="button" class="boton boton-edicion" data-accion="editar" data-id="${elemento.id}">
                    Editar
                </button>
                <button type="button" class="boton boton-eliminacion" data-accion="eliminar" data-id="${elemento.id}">
                    Eliminar
                </button>
            </td>
        `;

        return fila;
    }

    /**
     * Maneja los clics en los botones de acción de la tabla.
     * @param {Event} evento - Objeto de evento click.
     */
    manejarAccionesTabla(evento) {
        const boton = evento.target.closest('.boton');
        
        if (!boton) {
            return;
        }

        const accion = boton.dataset.accion;
        const id = parseInt(boton.dataset.id);

        switch (accion) {
            case 'editar':
                this.prepararEdicion(id);
                break;
            case 'eliminar':
                this.eliminarElemento(id);
                break;
        }
    }

    /**
     * Limpia el formulario y restablece el estado.
     */
    limpiarFormulario() {
        this.formulario.reset();
        this.campoId.value = '';
        this.elementoEdicion = null;
        this.botonGuardar.textContent = 'Añadir Elemento';
        this.botonCancelar.style.display = 'none';
        
        // Limpiar errores de validación
        document.querySelectorAll('.campo-texto, .campo-select').forEach(campo => {
            campo.classList.remove('error');
            const mensajeError = campo.parentElement.querySelector('.mensaje-error');
            if (mensajeError) {
                mensajeError.classList.remove('visible');
                mensajeError.textContent = '';
            }
        });
    }

    /**
     * Muestra un mensaje global al usuario.
     * @param {string} mensaje - Texto del mensaje.
     * @param {string} tipo - Tipo de mensaje ('exito' o 'error').
     */
    mostrarMensajeGlobal(mensaje, tipo) {
        // Crear elemento de mensaje temporal
        const mensajeElemento = document.createElement('div');
        mensajeElemento.className = `mensaje-global ${tipo}`;
        mensajeElemento.textContent = mensaje;
        mensajeElemento.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            animation: aparecer 0.3s ease;
            background-color: ${tipo === 'exito' ? 'var(--color-exito)' : 'var(--color-error)'};
        `;

        document.body.appendChild(mensajeElemento);

        // Eliminar después de 3 segundos
        setTimeout(() => {
            mensajeElemento.style.opacity = '0';
            mensajeElemento.style.transition = 'opacity 0.3s ease';
            setTimeout(() => mensajeElemento.remove(), 300);
        }, 3000);
    }

    /**
     * Escapa caracteres HTML para prevenir XSS.
     * @param {string} texto - Texto a escapar.
     * @returns {string} - Texto escapado.
     */
    escaparHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }
}

// Instanciación de la aplicación cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    new GestorTabla();
});