// Este evento se dispara cuando todo el contenido HTML del documento ha sido cargado y parseado.
// Es el mejor lugar para iniciar la lógica de tu aplicación.
document.addEventListener('DOMContentLoaded', () => {

    // --- Declaración de Constantes (Obtener elementos del HTML) ---
    // Selecciona todos los botones de navegación (Inicio, Base de Datos, etc.)
    const navButtons = document.querySelectorAll('.nav-button');
    // Selecciona todas las secciones de contenido (Inicio, Base de Datos, etc.)
    const contentSections = document.querySelectorAll('.content-section');
    // Obtiene el formulario para guardar personas por su ID
    const personForm = document.getElementById('person-form');
    // Obtiene el campo de búsqueda de personas por su ID
    const searchInput = document.getElementById('search-input');
    // Obtiene el contenedor donde se mostrarán los resultados de búsqueda de personas por su ID
    const searchResults = document.getElementById('search-results');

    // Obtiene el contenedor donde se mostrarán los PDFs pre-cargados por su ID
    const pdfList = document.getElementById('pdf-list');

    // --- Funcionalidad de Navegación (botones de sección) ---
    // Itera sobre cada botón de navegación para añadir un "escuchador de eventos"
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remueve la clase 'active' (que marca el botón como seleccionado) de todos los botones
            navButtons.forEach(btn => btn.classList.remove('active'));
            // Añade la clase 'active' al botón que fue clicado
            button.classList.add('active');

            // Remueve la clase 'active' (que muestra la sección) de todas las secciones de contenido
            contentSections.forEach(section => section.classList.remove('active'));

            // Obtiene el ID de la sección objetivo desde el atributo 'data-target' del botón
            const targetId = button.dataset.target;
            // Añade la clase 'active' a la sección objetivo para mostrarla
            document.getElementById(targetId).classList.add('active');

            // Lógica condicional para cargar datos cuando se cambia a ciertas secciones
            if (targetId === 'phones-section') {
                loadImportantPhones(); // Carga los teléfonos importantes si se va a esa sección
            }
            if (targetId === 'data-section') {
                renderPeople(); // Vuelve a renderizar la lista de personas si se va a esa sección
            }
        });
    });

    // Establece la sección de Inicio como activa por defecto al cargar la PWA
    document.getElementById('home-section').classList.add('active');
    // Marca el botón 'Inicio' como activo por defecto
    document.querySelector('.nav-button[data-target="home-section"]').classList.add('active');


    // --- Funcionalidad de Base de Datos de Personas (usando localStorage) ---
    // Intenta cargar la lista de personas desde localStorage. Si no hay nada, inicializa como un array vacío.
    let people = JSON.parse(localStorage.getItem('people')) || [];

    // Función para guardar la lista actual de personas en localStorage
    function savePeople() {
        localStorage.setItem('people', JSON.stringify(people)); // Convierte el array a string JSON antes de guardar
    }

    // Función para renderizar (mostrar) la lista de personas en la interfaz
    // Puede recibir un array filtrado para mostrar resultados de búsqueda
    function renderPeople(filteredPeople = people) {
        searchResults.innerHTML = ''; // Limpia el contenido anterior de los resultados de búsqueda
        if (filteredPeople.length === 0) {
            // Si no hay personas o no se encontraron resultados, muestra un mensaje
            searchResults.innerHTML = '<p>No hay personas registradas o no se encontraron resultados.</p>';
            return; // Sale de la función
        }
        // Itera sobre cada persona en el array (filtrado o completo)
        filteredPeople.forEach((person, index) => {
            const personCard = document.createElement('div'); // Crea un nuevo div para cada persona
            personCard.classList.add('person-card'); // Añade una clase para estilos
            // Rellena el HTML de la tarjeta de persona con sus datos
            personCard.innerHTML = `
                <p><strong>Nombre:</strong> ${person.name} ${person.lastname}</p>
                <p><strong>DNI:</strong> ${person.dni}</p>
                <p><strong>Patente:</strong> ${person.patente || 'N/A'}</p>
                <p><strong>Dirección:</strong> ${person.address || 'N/A'}</p>
                <p><strong>Teléfono:</strong> ${person.phone || 'N/A'}</p>
                <p><strong>Edad:</strong> ${person.age || 'N/A'}</p>
                <p><strong>Notas:</strong> ${person.notes || 'Sin notas'}</p>
                <button data-index="${index}">Eliminar</button> `;
            searchResults.appendChild(personCard); // Añade la tarjeta al contenedor de resultados
        });

        // Añade un escuchador de eventos a cada botón "Eliminar" recién creado
        searchResults.querySelectorAll('.person-card button').forEach(button => {
            button.addEventListener('click', (e) => {
                // Obtiene el índice de la persona a eliminar desde el atributo 'data-index'
                const indexToRemove = e.target.dataset.index;
                // Elimina la persona del array 'people' usando su índice
                people.splice(indexToRemove, 1);
                savePeople(); // Guarda los cambios en localStorage
                renderPeople(); // Vuelve a renderizar la lista para actualizar la vista
            });
        });
    }

    // Añade un escuchador de eventos al formulario de persona cuando se envía
    personForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Evita el comportamiento por defecto del formulario (recargar la página)

        // Crea un nuevo objeto 'person' con los valores de los campos del formulario
        const newPerson = {
            dni: document.getElementById('person-dni').value.trim(), // .trim() elimina espacios en blanco al inicio/final
            patente: document.getElementById('person-patente').value.trim(),
            name: document.getElementById('person-name').value.trim(),
            lastname: document.getElementById('person-lastname').value.trim(),
            address: document.getElementById('person-address').value.trim(), // Nuevo campo
            phone: document.getElementById('person-phone').value.trim(),     // Nuevo campo
            age: document.getElementById('person-age').value.trim(),         // Nuevo campo
            notes: document.getElementById('person-notes').value.trim(),
            id: Date.now() // Genera un ID único basado en la marca de tiempo actual
        };

        // Valida que el DNI no esté vacío (es un campo requerido)
        if (newPerson.dni) {
            people.push(newPerson); // Añade la nueva persona al array 'people'
            savePeople(); // Guarda el array actualizado en localStorage
            renderPeople(); // Actualiza la vista para mostrar la nueva persona
            personForm.reset(); // Limpia todos los campos del formulario
            alert('Persona guardada con éxito!'); // Muestra un mensaje de éxito
        } else {
            alert('El DNI es obligatorio.'); // Alerta si el DNI está vacío
        }
    });

    // Función de búsqueda de personas, se llama cada vez que el usuario escribe en el campo de búsqueda
    // 'window.searchPerson' la hace global para que pueda ser llamada desde el atributo 'onkeyup' en HTML
    window.searchPerson = () => {
        const searchTerm = searchInput.value.toLowerCase(); // Obtiene el término de búsqueda y lo convierte a minúsculas
        // Filtra el array 'people' para encontrar coincidencias en cualquier campo relevante
        const filtered = people.filter(person =>
            person.dni.toLowerCase().includes(searchTerm) ||
            person.patente.toLowerCase().includes(searchTerm) ||
            person.name.toLowerCase().includes(searchTerm) ||
            person.lastname.toLowerCase().includes(searchTerm) ||
            person.address.toLowerCase().includes(searchTerm) || // Incluye el nuevo campo 'address' en la búsqueda
            person.phone.toLowerCase().includes(searchTerm) ||   // Incluye el nuevo campo 'phone' en la búsqueda
            person.notes.toLowerCase().includes(searchTerm)
        );
        renderPeople(filtered); // Renderiza solo las personas filtradas
    };

    // --- Funcionalidad de Archivos y Documentos (PDFs pre-cargados por el desarrollador) ---
    // Define un array de objetos con la información de los PDFs que tú (el desarrollador) has pre-cargado.
    // Asegúrate de que los archivos listados aquí existan en la carpeta 'pdfs_app/' de tu proyecto.
    const preloadedPdfs = [
        { name: 'Ley Nacional de Tránsito N° 24.449', file: 'ley_de_transito.pdf', topic: 'Leyes y Normativas' },
        { name: 'Manual de Procedimientos de Inspección', file: 'manual_inspeccion.pdf', topic: 'Manuales' },
        { name: 'Protocolo de Primeros Auxilios', file: 'protocolo_primeros_auxilios.pdf', topic: 'Protocolos de Emergencia' },
        { name: 'Código Procesal Penal (Fragmento)', file: 'codigo_procesal_penal.pdf', topic: 'Leyes y Normativas' },
        { name: 'Guía de Actuación en Eventos Masivos', file: 'guia_eventos_masivos.pdf', topic: 'Protocolos de Emergencia' },
        // Puedes añadir más objetos PDF aquí siguiendo el mismo formato
    ];

    // Función para renderizar (mostrar) la lista de PDFs pre-cargados en la interfaz
    function renderPreloadedPdfs() {
        pdfList.innerHTML = ''; // Limpia el contenido anterior del contenedor de PDFs

        if (preloadedPdfs.length === 0) {
            // Si no hay PDFs definidos, muestra un mensaje
            pdfList.innerHTML = '<p>No hay documentos disponibles en este momento.</p>';
            return;
        }

        // Agrupa los PDFs por su 'topic' (tema)
        const groupedPdfs = preloadedPdfs.reduce((acc, pdf) => {
            const topic = pdf.topic || 'Sin tema'; // Usa 'Sin tema' si el PDF no tiene un tema definido
            if (!acc[topic]) {
                acc[topic] = []; // Si el tema no existe en el acumulador, crea un array para él
            }
            acc[topic].push(pdf); // Añade el PDF al array de su tema correspondiente
            return acc;
        }, {}); // El acumulador inicial es un objeto vacío

        // Itera sobre cada tema (clave) en el objeto 'groupedPdfs'
        for (const topic in groupedPdfs) {
            const topicDiv = document.createElement('div'); // Crea un div para cada grupo de tema
            topicDiv.classList.add('pdf-topic-group'); // Añade una clase para estilos
            topicDiv.innerHTML = `<h3>${topic}</h3>`; // Añade el título del tema

            // Itera sobre cada PDF dentro del tema actual
            groupedPdfs[topic].forEach(pdf => {
                const pdfItem = document.createElement('div'); // Crea un div para cada PDF individual
                pdfItem.classList.add('pdf-item'); // Añade una clase para estilos
                // Crea un enlace al archivo PDF. 'pdfs_app/' es la ruta a tu carpeta de PDFs.
                // 'target="_blank"' abre el PDF en una nueva pestaña/ventana del navegador.
                pdfItem.innerHTML = `
                    <a href="pdfs_app/${pdf.file}" target="_blank">${pdf.name}</a>
                `;
                topicDiv.appendChild(pdfItem); // Añade el elemento PDF al div del tema
            });
            pdfList.appendChild(topicDiv); // Añade el div del tema al contenedor principal de PDFs
        }
    }

    // --- Funcionalidad de Teléfonos Útiles ---
    // Define un array de objetos con los nombres y números de teléfono importantes
    const importantPhones = [
        { name: 'Comisaría 1ra (Rosario Centro)', phone: '4721472' },
        { name: 'Comisaría 2da (Rosario Sur)', phone: '4852485' },
        { name: 'Emergencias 911', phone: '911' },
        { name: 'Bomberos Rosario', phone: '100' },
        { name: 'Ambulancia (Sies 107)', phone: '107' }
        // Puedes añadir más objetos de teléfono aquí
    ];

    // Función para cargar y mostrar los teléfonos importantes en la interfaz
    function loadImportantPhones() {
        const phoneListDiv = document.getElementById('phone-list'); // Obtiene el contenedor de la lista de teléfonos
        phoneListDiv.innerHTML = ''; // Limpia el contenido anterior

        // Itera sobre cada elemento en el array 'importantPhones'
        importantPhones.forEach(item => {
            const phoneItem = document.createElement('div'); // Crea un div para cada elemento de teléfono
            phoneItem.classList.add('phone-item'); // Añade una clase para estilos
            // Rellena el HTML del elemento de teléfono.
            // 'href="tel:${item.phone}"' permite que el número sea clicable para llamar en dispositivos móviles.
            phoneItem.innerHTML = `
                <span>${item.name}:</span>
                <a href="tel:${item.phone}">${item.phone}</a>
            `;
            phoneListDiv.appendChild(phoneItem); // Añade el elemento al contenedor de la lista de teléfonos
        });
    }

    // --- Inicialización al cargar la PWA ---
    // Llama a estas funciones para que la información se muestre cuando la PWA se inicia
    renderPeople();      // Muestra las personas guardadas (si las hay)
    renderPreloadedPdfs(); // Muestra los PDFs pre-cargados

    // --- Registro del Service Worker ---
    // Verifica si el navegador soporta Service Workers
    if ('serviceWorker' in navigator) {
        // Cuando la ventana se ha cargado completamente, intenta registrar el Service Worker
        window.addEventListener('load', () => {
            // Registra el Service Worker ubicado en '/service-worker.js'
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    // Si el registro fue exitoso, imprime un mensaje en la consola del navegador
                    console.log('Service Worker registrado con éxito:', registration);
                })
                .catch(error => {
                    // Si el registro falla, imprime un mensaje de error en la consola
                    console.log('Fallo el registro del Service Worker:', error);
                });
        });
    }
}); // Fin de DOMContentLoaded