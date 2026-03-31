/**
 * Clase principal para gestionar la búsqueda de perfiles de GitHub.
 * Encapsula la lógica de API, manejo de errores y manipulación del DOM.
 */
class BuscadorGitHub {
    constructor() {
        // Configuración de la API
        this.urlBase = 'https://api.github.com/users';
        this.urlRepos = '/repos';
        
        // Referencias a elementos del DOM
        this.formulario = document.getElementById('formulario-busqueda');
        this.campoUsuario = document.getElementById('campo-usuario');
        this.botonBuscar = document.getElementById('boton-buscar');
        this.textoBoton = this.botonBuscar.querySelector('.texto-boton');
        this.contenedorMensaje = document.getElementById('contenedor-mensaje');
        this.contenedorPerfil = document.getElementById('contenedor-perfil');
        this.contenedorRepositorios = document.getElementById('contenedor-repositorios');
        this.listaRepositorios = document.getElementById('lista-repositorios');
        
        // Referencias a elementos del perfil
        this.elementosPerfil = {
            avatar: document.getElementById('avatar-usuario'),
            nombre: document.getElementById('nombre-usuario'),
            login: document.querySelector('.login'),
            enlace: document.getElementById('enlace-github'),
            repos: document.getElementById('contador-repos'),
            seguidores: document.getElementById('contador-seguidores'),
            seguidos: document.getElementById('contador-seguidos'),
            bio: document.getElementById('bio-usuario'),
            ubicacion: document.getElementById('ubicacion-usuario'),
            empresa: document.getElementById('empresa-usuario'),
            sitio: document.getElementById('sitio-usuario')
        };

        // Mapa para almacenar datos en caché (Estructura de datos - Map)
        this.cachedDatos = new Map();

        // Inicialización de eventos
        this.inicializar();
    }

    /**
     * Configura los escuchadores de eventos para los controles.
     */
    inicializar() {
        this.formulario.addEventListener('submit', (evento) => this.manejarBusqueda(evento));
    }

    /**
     * Orquesta el proceso de búsqueda del perfil.
     * @param {Event} evento - Objeto de evento del submit.
     */
    async manejarBusqueda(evento) {
        evento.preventDefault();
        
        const nombreUsuario = this.campoUsuario.value.trim();
        
        // Validación de entrada vacía
        if (!nombreUsuario) {
            this.mostrarMensaje('Por favor, ingresa un nombre de usuario.', 'error');
            return;
        }

        // Iniciar estado de carga
        this.iniciarCarga();
        this.ocultarResultados();

        try {
            // Obtener datos del perfil
            const datosPerfil = await this.obtenerDatosPerfil(nombreUsuario);
            
            // Obtener repositorios
            const datosRepositorios = await this.obtenerRepositorios(nombreUsuario);
            
            // Almacenar en caché (Estructura de datos - Map)
            this.cachedDatos.set(nombreUsuario.toLowerCase(), {
                perfil: datosPerfil,
                repositorios: datosRepositorios,
                fecha: Date.now()
            });

            // Renderizar resultados
            this.renderizarPerfil(datosPerfil);
            this.renderizarRepositorios(datosRepositorios);
            this.mostrarMensaje(`Perfil de ${datosPerfil.name || datosPerfil.login} encontrado.`, 'exito');

        } catch (error) {
            // Manejo de errores (try/catch - Manejo de errores.pdf)
            console.error('Error en búsqueda:', error);
            
            if (error.tipo === 'USUARIO_NO_ENCONTRADO') {
                this.mostrarMensaje('Usuario no encontrado. Verifica el nombre e inténtalo de nuevo.', 'error');
            } else if (error.tipo === 'ERROR_RED') {
                this.mostrarMensaje('Error de conexión. Verifica tu internet e inténtalo de nuevo.', 'error');
            } else if (error.tipo === 'TASA_LIMITE') {
                this.mostrarMensaje('Límite de API alcanzado. Intenta en unos minutos.', 'error');
            } else {
                this.mostrarMensaje('Ocurrió un error inesperado. Inténtalo de nuevo.', 'error');
            }
        } finally {
            // Finalizar estado de carga
            this.finalizarCarga();
        }
    }

    /**
     * Realiza la llamada a la API para obtener datos del perfil.
     * @param {string} nombreUsuario - Nombre de usuario de GitHub.
     * @returns {Promise<Object>} - Datos del perfil.
     */
    async obtenerDatosPerfil(nombreUsuario) {
        const url = `${this.urlBase}/${nombreUsuario}`;
        
        // Verificar caché primero (Estructura de datos - Map)
        const datosEnCaché = this.cachedDatos.get(nombreUsuario.toLowerCase());
        if (datosEnCaché && (Date.now() - datosEnCaché.fecha < 300000)) {
            return datosEnCaché.perfil;
        }

        const respuesta = await fetch(url);
        
        // Manejo de respuestas de error HTTP
        if (respuesta.status === 404) {
            throw { tipo: 'USUARIO_NO_ENCONTRADO', mensaje: 'Usuario no encontrado' };
        }
        
        if (respuesta.status === 403) {
            throw { tipo: 'TASA_LIMITE', mensaje: 'Límite de tasa alcanzado' };
        }
        
        if (!respuesta.ok) {
            throw { tipo: 'ERROR_RED', mensaje: `Error HTTP: ${respuesta.status}` };
        }

        return await respuesta.json();
    }

    /**
     * Realiza la llamada a la API para obtener repositorios.
     * @param {string} nombreUsuario - Nombre de usuario de GitHub.
     * @returns {Promise<Array>} - Lista de repositorios.
     */
    async obtenerRepositorios(nombreUsuario) {
        const url = `${this.urlBase}/${nombreUsuario}${this.urlRepos}?sort=updated&per_page=6`;
        
        // Verificar caché primero
        const datosEnCaché = this.cachedDatos.get(nombreUsuario.toLowerCase());
        if (datosEnCaché && (Date.now() - datosEnCaché.fecha < 300000)) {
            return datosEnCaché.repositorios;
        }

        const respuesta = await fetch(url);
        
        if (!respuesta.ok) {
            throw { tipo: 'ERROR_RED', mensaje: `Error HTTP: ${respuesta.status}` };
        }

        return await respuesta.json();
    }

    /**
     * Renderiza la información del perfil en el DOM.
     * @param {Object} datos - Datos del perfil de GitHub.
     */
    renderizarPerfil(datos) {
        // Actualizar elementos del perfil
        this.elementosPerfil.avatar.src = datos.avatar_url;
        this.elementosPerfil.avatar.alt = `Avatar de ${datos.login}`;
        this.elementosPerfil.nombre.textContent = datos.name || datos.login;
        this.elementosPerfil.login.textContent = datos.login;
        this.elementosPerfil.enlace.href = datos.html_url;
        this.elementosPerfil.repos.textContent = this.formatearNumero(datos.public_repos);
        this.elementosPerfil.seguidores.textContent = this.formatearNumero(datos.followers);
        this.elementosPerfil.seguidos.textContent = this.formatearNumero(datos.following);
        this.elementosPerfil.bio.textContent = datos.bio || '';
        this.elementosPerfil.ubicacion.textContent = datos.location ? `📍 ${datos.location}` : '';
        this.elementosPerfil.empresa.textContent = datos.company ? `🏢 ${datos.company}` : '';
        this.elementosPerfil.sitio.textContent = datos.blog ? `🔗 ${datos.blog}` : '';

        // Mostrar contenedor de perfil
        this.contenedorPerfil.classList.add('visible');
    }

    /**
     * Renderiza la lista de repositorios en el DOM.
     * @param {Array} repositorios - Lista de repositorios de GitHub.
     */
    renderizarRepositorios(repositorios) {
        // Limpiar lista anterior
        this.listaRepositorios.innerHTML = '';

        // Verificar si hay repositorios
        if (repositorios.length === 0) {
            this.listaRepositorios.innerHTML = '<p class="mensaje-vacio">Este usuario no tiene repositorios públicos.</p>';
            this.contenedorRepositorios.classList.add('visible');
            return;
        }

        // Crear tarjetas de repositorios (Estructura de datos - Array.forEach)
        repositorios.forEach(repo => {
            const tarjeta = document.createElement('article');
            tarjeta.className = 'tarjeta-repositorio';
            
            tarjeta.innerHTML = `
                <h4><a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name}</a></h4>
                <p class="descripcion-repo">${repo.description || 'Sin descripción disponible'}</p>
                <div class="meta-repo">
                    <span>📦 ${repo.language || 'N/A'}</span>
                    <span>⭐ ${this.formatearNumero(repo.stargazers_count)}</span>
                    <span>🍴 ${this.formatearNumero(repo.forks_count)}</span>
                </div>
            `;
            
            this.listaRepositorios.appendChild(tarjeta);
        });

        // Mostrar contenedor de repositorios
        this.contenedorRepositorios.classList.add('visible');
    }

    /**
     * Muestra un mensaje al usuario.
     * @param {string} texto - Contenido del mensaje.
     * @param {string} tipo - Tipo de mensaje ('exito' o 'error').
     */
    mostrarMensaje(texto, tipo) {
        this.contenedorMensaje.textContent = texto;
        this.contenedorMensaje.className = `mensaje ${tipo} visible`;
    }

    /**
     * Oculta los resultados anteriores.
     */
    ocultarResultados() {
        this.contenedorPerfil.classList.remove('visible');
        this.contenedorRepositorios.classList.remove('visible');
        this.contenedorMensaje.classList.remove('visible', 'exito', 'error');
    }

    /**
     * Activa el estado visual de carga en el botón.
     */
    iniciarCarga() {
        this.botonBuscar.classList.add('cargando');
        this.botonBuscar.disabled = true;
        this.textoBoton.textContent = 'Buscando...';
    }

    /**
     * Desactiva el estado visual de carga en el botón.
     */
    finalizarCarga() {
        this.botonBuscar.classList.remove('cargando');
        this.botonBuscar.disabled = false;
        this.textoBoton.textContent = 'Buscar';
    }

    /**
     * Formatea números grandes para mejor legibilidad.
     * @param {number} numero - Número a formatear.
     * @returns {string} - Número formateado.
     */
    formatearNumero(numero) {
        return new Intl.NumberFormat('es-ES').format(numero);
    }
}

// Instanciación de la aplicación cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    new BuscadorGitHub();
});