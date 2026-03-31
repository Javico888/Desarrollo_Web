/**
 * Clase principal para gestionar la base de datos de empleados.
 * Encapsula la lógica de CRUD, validación, búsqueda y estadísticas.
 */
class GestorEmpleados {
    constructor() {
        // Estructura de datos principal (Map para almacenamiento eficiente)
        this.empleados = new Map();
        this.empleadoEdicion = null;
        this.empleadoAEliminar = null;

        // Referencias a elementos del DOM
        this.formulario = document.getElementById('formulario-empleado');
        this.campoId = document.getElementById('campo-id');
        this.campoNombre = document.getElementById('campo-nombre');
        this.campoApellido = document.getElementById('campo-apellido');
        this.campoEmail = document.getElementById('campo-email');
        this.campoTelefono = document.getElementById('campo-telefono');
        this.campoSalario = document.getElementById('campo-salario');
        this.campoFechaNacimiento = document.getElementById('campo-fecha-nacimiento');
        this.campoImagen = document.getElementById('campo-imagen');
        // NUEVO: Referencia al input de archivo local
        this.campoArchivoImagen = document.getElementById('campo-archivo-imagen');
        this.botonGuardar = document.getElementById('boton-guardar');
        this.botonCancelar = document.getElementById('boton-cancelar');
        this.campoBusqueda = document.getElementById('campo-busqueda');
        this.filtroOrden = document.getElementById('filtro-orden');
        this.cuerpoTabla = document.getElementById('cuerpo-tabla');
        this.mensajeVacio = document.getElementById('mensaje-vacio');
        this.contadorEmpleados = document.getElementById('contador-empleados');
        
        // Referencias a estadísticas
        this.totalEmpleados = document.getElementById('total-empleados');
        this.salarioPromedio = document.getElementById('salario-promedio');
        this.edadPromedio = document.getElementById('edad-promedio');

        // Referencias al modal
        this.modal = document.getElementById('modal-confirmacion');
        this.nombreEmpleadoEliminar = document.getElementById('nombre-empleado-eliminar');
        this.botonCancelarModal = document.getElementById('boton-cancelar-modal');
        this.botonConfirmarEliminar = document.getElementById('boton-confirmar-eliminar');
        this.botonCerrarModal = document.querySelector('.boton-cerrar-modal');

        // Patrón de email para validación
        this.patronEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
        this.campoBusqueda.addEventListener('input', () => this.aplicarBusqueda());
        
        // Evento de ordenamiento
        this.filtroOrden.addEventListener('change', () => this.aplicarOrdenamiento());
        
        // Delegación de eventos para botones de acción en la tabla
        this.cuerpoTabla.addEventListener('click', (evento) => this.manejarAccionesTabla(evento));
        
        // Eventos del modal
        this.botonCancelarModal.addEventListener('click', () => this.cerrarModal());
        this.botonConfirmarEliminar.addEventListener('click', () => this.confirmarEliminacion());
        this.botonCerrarModal.addEventListener('click', () => this.cerrarModal());
        this.modal.addEventListener('click', (evento) => {
            if (evento.target === this.modal) {
                this.cerrarModal();
            }
        });

        // Validación en tiempo real de campos
        this.campoNombre.addEventListener('blur', () => this.validarCampo(this.campoNombre));
        this.campoApellido.addEventListener('blur', () => this.validarCampo(this.campoApellido));
        this.campoEmail.addEventListener('blur', () => this.validarCampo(this.campoEmail));
        this.campoTelefono.addEventListener('blur', () => this.validarCampo(this.campoTelefono));
        this.campoSalario.addEventListener('blur', () => this.validarCampo(this.campoSalario));
        this.campoFechaNacimiento.addEventListener('change', () => this.validarCampo(this.campoFechaNacimiento));
        this.campoImagen.addEventListener('blur', () => this.validarCampo(this.campoImagen));
        
        // NUEVO: Inicializar carga de imagen desde archivo
        this.inicializarCargaImagen();
    }

    /**
     * Configura el evento para leer archivo local y convertirlo a Base64.
     */
    inicializarCargaImagen() {
        if (this.campoArchivoImagen) {
            this.campoArchivoImagen.addEventListener('change', (evento) => {
                const archivo = evento.target.files[0];
                
                if (archivo) {
                    // Verificar que sea una imagen
                    if (!archivo.type.startsWith('image/')) {
                        this.mostrarMensajeToast('Por favor selecciona un archivo de imagen válido.', 'error');
                        this.campoArchivoImagen.value = '';
                        return;
                    }

                    // Leer archivo como Data URL (Base64)
                    const lector = new FileReader();
                    lector.onload = (e) => {
                        // Asignar el resultado al campo de URL existente
                        // Esto permite que las funciones existentes lo procesen sin cambios
                        this.campoImagen.value = e.target.result;
                    };
                    lector.onerror = () => {
                        this.mostrarMensajeToast('Error al leer el archivo.', 'error');
                    };
                    lector.readAsDataURL(archivo);
                }
            });
        }
    }

    cargarDatosEjemplo() {

        this.renderizarTabla();
        this.actualizarEstadisticas();

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
                apellido: this.campoApellido.value.trim(),
                email: this.campoEmail.value.trim().toLowerCase(),
                telefono: this.campoTelefono.value.trim(),
                salario: parseFloat(this.campoSalario.value),
                fechaNacimiento: this.campoFechaNacimiento.value,
                imagen: this.campoImagen.value.trim()
            };

            // Verificar email duplicado (excepto en edición del mismo empleado)
            const emailDuplicado = this.verificarEmailDuplicado(datos.email, datos.id);
            if (emailDuplicado) {
                throw new Error('El correo electrónico ya está registrado.');
            }

            // Crear o actualizar empleado
            if (this.empleadoEdicion) {
                this.actualizarEmpleado(datos);
            } else {
                this.crearEmpleado(datos);
            }

            // Limpiar formulario y actualizar tabla
            this.limpiarFormulario();
            this.aplicarBusqueda();
            this.actualizarEstadisticas();

        } catch (error) {
            console.error('Error en formulario:', error.message);
            this.mostrarMensajeToast(error.message, 'error');
        }
    }

    /**
     * Crea un nuevo empleado en la estructura de datos.
     * @param {Object} datos - Datos del nuevo empleado.
     */
    crearEmpleado(datos) {
        this.empleados.set(datos.id, datos);
        this.mostrarMensajeToast('Empleado agregado correctamente.', 'exito');
    }

    /**
     * Actualiza un empleado existente en la estructura de datos.
     * @param {Object} datos - Datos actualizados del empleado.
     */
    actualizarEmpleado(datos) {
        const empleadoExistente = this.empleados.get(datos.id);
        
        if (empleadoExistente) {
            this.empleados.set(datos.id, { ...empleadoExistente, ...datos });
            this.empleadoEdicion = null;
            this.mostrarMensajeToast('Empleado actualizado correctamente.', 'exito');
        }
    }

    /**
     * Elimina un empleado de la estructura de datos.
     * @param {number} id - ID del empleado a eliminar.
     */
    eliminarEmpleado(id) {
        try {
            this.empleados.delete(id);
            this.aplicarBusqueda();
            this.actualizarEstadisticas();
            this.mostrarMensajeToast('Empleado eliminado correctamente.', 'exito');
        } catch (error) {
            console.error('Error al eliminar:', error.message);
            this.mostrarMensajeToast('Error al eliminar el empleado.', 'error');
        }
    }

    /**
     * Prepara el formulario para editar un empleado.
     * @param {number} id - ID del empleado a editar.
     */
    prepararEdicion(id) {
        const empleado = this.empleados.get(id);
        
        if (!empleado) {
            return;
        }

        this.empleadoEdicion = id;
        this.campoId.value = empleado.id;
        this.campoNombre.value = empleado.nombre;
        this.campoApellido.value = empleado.apellido;
        this.campoEmail.value = empleado.email;
        this.campoTelefono.value = empleado.telefono;
        this.campoSalario.value = empleado.salario;
        this.campoFechaNacimiento.value = empleado.fechaNacimiento;
        this.campoImagen.value = empleado.imagen;

        this.botonGuardar.querySelector('.texto-boton').textContent = 'Actualizar Empleado';
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
     * Muestra el modal de confirmación para eliminación.
     * @param {number} id - ID del empleado a eliminar.
     */
    mostrarModalEliminacion(id) {
        const empleado = this.empleados.get(id);
        
        if (!empleado) {
            return;
        }

        this.empleadoAEliminar = id;
        this.nombreEmpleadoEliminar.textContent = `${empleado.nombre} ${empleado.apellido}`;
        this.modal.style.display = 'flex';
        this.modal.setAttribute('aria-hidden', 'false');
    }

    /**
     * Cierra el modal de confirmación.
     */
    cerrarModal() {
        this.modal.style.display = 'none';
        this.modal.setAttribute('aria-hidden', 'true');
        this.empleadoAEliminar = null;
    }

    /**
     * Confirma la eliminación del empleado.
     */
    confirmarEliminacion() {
        if (this.empleadoAEliminar) {
            this.eliminarEmpleado(this.empleadoAEliminar);
            this.cerrarModal();
        }
    }

    /**
     * Cancela el proceso de edición y limpia el formulario.
     */
    cancelarEdicion() {
        this.empleadoEdicion = null;
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

            case 'campo-apellido':
                if (!campo.value.trim()) {
                    esValido = false;
                    mensaje = 'El apellido es requerido.';
                } else if (campo.value.trim().length < 2) {
                    esValido = false;
                    mensaje = 'El apellido debe tener al menos 2 caracteres.';
                }
                break;

            case 'campo-email':
                if (!campo.value.trim()) {
                    esValido = false;
                    mensaje = 'El correo electrónico es requerido.';
                } else if (!this.patronEmail.test(campo.value.trim())) {
                    esValido = false;
                    mensaje = 'Ingresa un correo electrónico válido.';
                }
                break;

            case 'campo-telefono':
                if (!campo.value.trim()) {
                    esValido = false;
                    mensaje = 'El teléfono es requerido.';
                } else if (!/^[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/.test(campo.value.trim())) {
                    esValido = false;
                    mensaje = 'Ingresa un número de teléfono válido.';
                }
                break;

            case 'campo-salario':
                const salario = parseFloat(campo.value);
                if (!campo.value) {
                    esValido = false;
                    mensaje = 'El salario es requerido.';
                } else if (isNaN(salario) || salario < 0) {
                    esValido = false;
                    mensaje = 'El salario debe ser un número positivo.';
                }
                break;

            case 'campo-fecha-nacimiento':
                if (!campo.value) {
                    esValido = false;
                    mensaje = 'La fecha de nacimiento es requerida.';
                } else {
                    const fechaNacimiento = new Date(campo.value);
                    const fechaActual = new Date();
                    const edad = fechaActual.getFullYear() - fechaNacimiento.getFullYear();
                    
                    if (edad < 18 || edad > 100) {
                        esValido = false;
                        mensaje = 'La edad debe estar entre 18 y 100 años.';
                    }
                }
                break;

            case 'campo-imagen':
                if (campo.value.trim()) {
                    try {
                        new URL(campo.value.trim());
                    } catch {
                        esValido = false;
                        mensaje = 'Ingresa una URL válida.';
                    }
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
        const campos = [
            this.campoNombre, 
            this.campoApellido, 
            this.campoEmail, 
            this.campoTelefono, 
            this.campoSalario, 
            this.campoFechaNacimiento,
            this.campoImagen
        ];
        let esValido = true;

        campos.forEach(campo => {
            if (!this.validarCampo(campo)) {
                esValido = false;
            }
        });

        return esValido;
    }

    /**
     * Verifica si el email ya está registrado (excepto para el empleado en edición).
     * @param {string} email - Correo electrónico a verificar.
     * @param {number} idActual - ID del empleado actual (para edición).
     * @returns {boolean} - True si el email está duplicado.
     */
    verificarEmailDuplicado(email, idActual) {
        for (const [id, empleado] of this.empleados) {
            if (empleado.email === email && id !== idActual) {
                return true;
            }
        }
        return false;
    }

    /**
     * Aplica la búsqueda en tiempo real a los empleados.
     */
    aplicarBusqueda() {
        const terminoBusqueda = this.campoBusqueda.value.toLowerCase().trim();

        // Filtrar empleados (método filter aplicado a Map)
        const empleadosFiltrados = Array.from(this.empleados.values()).filter(empleado => {
            const nombreCompleto = `${empleado.nombre} ${empleado.apellido}`.toLowerCase();
            return (
                nombreCompleto.includes(terminoBusqueda) ||
                empleado.email.includes(terminoBusqueda) ||
                empleado.telefono.includes(terminoBusqueda)
            );
        });

        // Aplicar ordenamiento actual
        const empleadosOrdenados = this.ordenarEmpleados(empleadosFiltrados);

        // Renderizar resultados
        this.renderizarTabla(empleadosOrdenados);
    }

    /**
     * Aplica el ordenamiento seleccionado desde el dropdown.
     */
    aplicarOrdenamiento() {
        this.aplicarBusqueda();
    }

    /**
     * Ordena el array de empleados según criterios establecidos.
     * @param {Array} empleados - Array a ordenar.
     * @returns {Array} - Array ordenado.
     */
    ordenarEmpleados(empleados) {
        const valorOrden = this.filtroOrden.value;
        const [campo, direccion] = valorOrden.split('-');

        // Método sort de Array (Funciones y eventos.pdf)
        return [...empleados].sort((a, b) => {
            let valorA, valorB;

            switch (campo) {
                case 'nombre':
                    valorA = `${a.nombre} ${a.apellido}`.toLowerCase();
                    valorB = `${b.nombre} ${b.apellido}`.toLowerCase();
                    break;
                case 'salario':
                    valorA = a.salario;
                    valorB = b.salario;
                    break;
                case 'fecha':
                    valorA = new Date(a.fechaNacimiento);
                    valorB = new Date(b.fechaNacimiento);
                    break;
                default:
                    valorA = a.nombre.toLowerCase();
                    valorB = b.nombre.toLowerCase();
            }

            let comparacion = 0;
            if (valorA < valorB) comparacion = -1;
            if (valorA > valorB) comparacion = 1;

            return direccion === 'asc' ? comparacion : -comparacion;
        });
    }

    /**
     * Renderiza la tabla con los empleados proporcionados.
     * @param {Array} empleados - Array de empleados a renderizar.
     */
    renderizarTabla(empleados = null) {
        const empleadosMostrar = empleados || this.ordenarEmpleados(Array.from(this.empleados.values()));

        // Limpiar cuerpo de tabla
        this.cuerpoTabla.innerHTML = '';

        // Mostrar u ocultar mensaje de vacío
        if (empleadosMostrar.length === 0) {
            this.mensajeVacio.style.display = 'block';
            this.contadorEmpleados.textContent = '0 empleados mostrados';
            return;
        }

        this.mensajeVacio.style.display = 'none';

        // Renderizar filas (método forEach de Array)
        empleadosMostrar.forEach(empleado => {
            const fila = this.crearFilaTabla(empleado);
            this.cuerpoTabla.appendChild(fila);
        });

        // Actualizar contador
        this.contadorEmpleados.textContent = `${empleadosMostrar.length} empleado(s) mostrados`;
    }

    /**
     * Crea un elemento tr para la tabla.
     * @param {Object} empleado - Datos del empleado.
     * @returns {HTMLElement} - Elemento tr creado.
     */
    crearFilaTabla(empleado) {
        const fila = document.createElement('tr');
        fila.dataset.id = empleado.id;

        const edad = this.calcularEdad(empleado.fechaNacimiento);
        const fotoHTML = this.generarFotoHTML(empleado);

        fila.innerHTML = `
            <td>${fotoHTML}</td>
            <td><strong>${this.escaparHTML(empleado.nombre)} ${this.escaparHTML(empleado.apellido)}</strong></td>
            <td>${this.escaparHTML(empleado.email)}</td>
            <td>${this.escaparHTML(empleado.telefono)}</td>
            <td>$${this.formatearNumero(empleado.salario)}</td>
            <td>${edad} años</td>
            <td class="acciones">
                <button type="button" class="boton boton-edicion" data-accion="editar" data-id="${empleado.id}">
                    Editar
                </button>
                <button type="button" class="boton boton-eliminacion" data-accion="eliminar" data-id="${empleado.id}">
                    Eliminar
                </button>
            </td>
        `;

        return fila;
    }

    /**
     * Genera el HTML para la foto del empleado.
     * @param {Object} empleado - Datos del empleado.
     * @returns {string} - HTML de la foto.
     */
    generarFotoHTML(empleado) {
        if (empleado.imagen && empleado.imagen.trim()) {
            return `<img src="${this.escaparHTML(empleado.imagen)}" alt="Foto de ${empleado.nombre}" class="foto-empleado" onerror="this.classList.add('sin-foto'); this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${empleado.nombre.charAt(0)}</text></svg>'">`;
        } else {
            const inicial = empleado.nombre.charAt(0).toUpperCase();
            return `<div class="foto-empleado sin-foto">${inicial}</div>`;
        }
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
                this.mostrarModalEliminacion(id);
                break;
        }
    }

    /**
     * Calcula la edad basada en la fecha de nacimiento.
     * @param {string} fechaNacimiento - Fecha de nacimiento en formato YYYY-MM-DD.
     * @returns {number} - Edad en años.
     */
    calcularEdad(fechaNacimiento) {
        const fechaNac = new Date(fechaNacimiento);
        const fechaActual = new Date();
        let edad = fechaActual.getFullYear() - fechaNac.getFullYear();
        const mes = fechaActual.getMonth() - fechaNac.getMonth();
        
        if (mes < 0 || (mes === 0 && fechaActual.getDate() < fechaNac.getDate())) {
            edad--;
        }
        
        return edad;
    }

    /**
     * Actualiza las estadísticas de empleados.
     */
    actualizarEstadisticas() {
        const empleadosArray = Array.from(this.empleados.values());
        
        // Total de empleados
        const total = empleadosArray.length;
        this.totalEmpleados.textContent = total;

        // Salario promedio
        if (total > 0) {
            const sumaSalarios = empleadosArray.reduce((suma, emp) => suma + emp.salario, 0);
            const promedioSalario = sumaSalarios / total;
            this.salarioPromedio.textContent = `$${this.formatearNumero(promedioSalario.toFixed(2))}`;
        } else {
            this.salarioPromedio.textContent = '$0';
        }

        // Edad promedio
        if (total > 0) {
            const sumaEdades = empleadosArray.reduce((suma, emp) => suma + this.calcularEdad(emp.fechaNacimiento), 0);
            const promedioEdad = Math.round(sumaEdades / total);
            this.edadPromedio.textContent = promedioEdad;
        } else {
            this.edadPromedio.textContent = '0';
        }
    }

    /**
     * Limpia el formulario y restablece el estado.
     */
    limpiarFormulario() {
        this.formulario.reset();
        this.campoId.value = '';
        this.empleadoEdicion = null;
        this.botonGuardar.querySelector('.texto-boton').textContent = 'Agregar Empleado';
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
     * Muestra un mensaje toast al usuario.
     * @param {string} mensaje - Texto del mensaje.
     * @param {string} tipo - Tipo de mensaje ('exito', 'error', 'advertencia').
     */
    mostrarMensajeToast(mensaje, tipo) {
        const mensajeElemento = document.createElement('div');
        mensajeElemento.className = `mensaje-toast ${tipo}`;
        mensajeElemento.textContent = mensaje;

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

    /**
     * Formatea números con separadores de miles.
     * @param {number|string} numero - Número a formatear.
     * @returns {string} - Número formateado.
     */
    formatearNumero(numero) {
        return new Intl.NumberFormat('es-ES').format(numero);
    }
}

// Instanciación de la aplicación cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    new GestorEmpleados();
});