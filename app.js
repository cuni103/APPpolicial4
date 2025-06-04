// Este evento se dispara cuando todo el contenido HTML del documento ha sido cargado y parseado.
// Es el mejor lugar para iniciar la lógica de tu aplicación.
document.addEventListener('DOMContentLoaded', () => {

    // --- Declaración de Constantes (Obtener elementos del HTML) ---
    // Selecciona todos los botones de navegación (Inicio, Base de Datos, etc.)
    const navButtons = document.querySelectorAll('.nav-button');
    // Selecciona todas las secciones de contenido (Inicio, Base de Datos, etc.)
    const contentSections = document.querySelectorAll('.content-section');

    // Elementos de la sección "Base de Datos"
    const personForm = document.getElementById('person-form'); // Formulario para guardar personas
    const searchInput = document.getElementById('search-input'); // Campo de búsqueda
    const searchResultsDiv = document.getElementById('search-results'); // Contenedor para resultados de búsqueda
    const allPersonsListDiv = document.getElementById('all-persons-list'); // Contenedor para la lista completa de personas

    // Elementos del formulario de persona
    const inputPhoto = document.getElementById('person-photo'); // Input para cargar la foto
    const previewPhoto = document.getElementById('preview-photo'); // Elemento <img> para la vista previa de la foto
    let photoBase64 = null; // Variable para almacenar la foto en Base64

    // --- Configuración de la Base de Datos (IndexedDB) ---
    const DB_NAME = 'appPolicialDB';
    const DB_VERSION = 2; // ¡IMPORTANTE! Incrementar la versión para que se dispare onupgradeneeded y se actualice el esquema
    const STORE_NAME = 'personas'; // Nombre del "Object Store" (similar a una tabla)

    let db; // Variable para almacenar la instancia de la base de datos IndexedDB

    // Función para abrir o crear la base de datos IndexedDB
    const openDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            // Este evento se dispara si la base de datos es nueva o si la versión ha cambiado.
            // Es el lugar para crear o actualizar los "Object Stores" (tablas).
            request.onupgradeneeded = (event) => {
                db = event.target.result;
                // Si el "Object Store" 'personas' ya existe, lo eliminamos para recrearlo con el nuevo esquema.
                // Esto borrará los datos existentes si la versión de la DB se incrementa.
                if (db.objectStoreNames.contains(STORE_NAME)) {
                    db.deleteObjectStore(STORE_NAME);
                }
                // Creamos el nuevo "Object Store" 'personas' con 'id' como clave primaria auto-incremental.
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                // Creamos índices para campos por los que querremos buscar eficientemente.
                store.createIndex('dni', 'dni', { unique: false });
                store.createIndex('patente', 'patente', { unique: false });
                store.createIndex('name', 'name', { unique: false }); // Índice para el nombre
                store.createIndex('lastname', 'lastname', { unique: false }); // Índice para el apellido
                console.log('Object Store creado o actualizado:', STORE_NAME);
            };

            // Este evento se dispara cuando la base de datos se abre con éxito.
            request.onsuccess = (event) => {
                db = event.target.result;
                console.log('Base de datos abierta con éxito:', DB_NAME);
                resolve(db);
            };

            // Este evento se dispara si hay un error al abrir la base de datos.
            request.onerror = (event) => {
                console.error('Error al abrir la base de datos:', event.target.error);
                reject(event.target.error);
            };
        });
    };

    // Función para añadir una nueva persona a IndexedDB
    const addPersona = (persona) => {
        return new Promise((resolve, reject) => {
            // Se crea una transacción de lectura/escritura en el "Object Store" 'personas'.
            const transaction = db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.add(persona); // Se añade el objeto persona al store.

            request.onsuccess = () => {
                console.log('Persona añadida con éxito');
                resolve(); // Resuelve la promesa si la operación es exitosa.
            };

            request.onerror = (event) => {
                console.error('Error al añadir persona:', event.target.error);
                reject(event.target.error); // Rechaza la promesa si hay un error.
            };
        });
    };

    // Función para obtener todas las personas de IndexedDB
    const getPersonas = () => {
        return new Promise((resolve, reject) => {
            // Se crea una transacción de solo lectura en el "Object Store" 'personas'.
            const transaction = db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll(); // Se solicita obtener todos los objetos del store.

            request.onsuccess = (event) => {
                resolve(event.target.result); // Resuelve la promesa con el array de personas.
            };

            request.onerror = (event) => {
                console.error('Error al obtener personas:', event.target.error);
                reject(event.target.error); // Rechaza la promesa si hay un error.
            };
        });
    };

    // Función para mostrar las personas en la interfaz (se usa para búsqueda y lista completa)
    // 'targetElement' es el div donde se mostrarán los resultados (search-results o all-persons-list)
    // 'personsToDisplay' es el array de personas a mostrar (filtradas o todas)
    // 'searchTerm' es el texto de búsqueda actual (opcional)
    const displayPersonas = (targetElement, personsToDisplay, searchTerm = '') => {
        targetElement.innerHTML = ''; // Limpiar el contenido anterior del contenedor

        if (personsToDisplay.length === 0) {
            targetElement.innerHTML = `<p>${searchTerm ? 'No hay personas que coincidan con la búsqueda.' : 'No hay personas registradas aún.'}</p>`;
            return;
        }

        personsToDisplay.forEach(persona => {
            const personCard = document.createElement('div'); // Crea un div para cada persona
            personCard.classList.add('person-card'); // Añade una clase para estilos

            let photoHtml = '';
            if (persona.photo) { // Si la persona tiene una foto (Data URL en Base64)
                photoHtml = `<img src="${persona.photo}" alt="Foto de ${persona.name}">`;
            }

            // Rellena el HTML de la tarjeta de persona con sus datos
            personCard.innerHTML = `
                ${photoHtml}
                <div class="person-info">
                    <h4>${persona.name || ''} ${persona.lastname || ''}</h4>
                    ${persona.dni ? `<p><strong>DNI:</strong> ${persona.dni}</p>` : ''}
                    ${persona.patente ? `<p><strong>Patente:</strong> ${persona.patente}</p>` : ''}
                    ${persona.address ? `<p><strong>Dirección:</strong> ${persona.address}</p>` : ''}
                    ${persona.age ? `<p><strong>Edad:</strong> ${persona.age}</p>` : ''}
                    ${persona.phone ? `<p><strong>Teléfono:</strong> ${persona.phone}</p>` : ''}
                    ${persona.notes ? `<p><strong>Información Importante:</strong> ${persona.notes}</p>` : ''}
                    <small>Registrado: ${new Date(persona.timestamp).toLocaleString()}</small>
                    <button class="delete-button" data-id="${persona.id}">Eliminar</button>
                </div>
            `;
            targetElement.appendChild(personCard); // Añade la tarjeta al contenedor.
        });

        // Añadir escuchadores de eventos para los botones de eliminar
        targetElement.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', async (e) => {
                const idToDelete = parseInt(e.target.dataset.id); // Obtener el ID del registro a eliminar
                try {
                    const transaction = db.transaction([STORE_NAME], 'readwrite');
                    const store = transaction.objectStore(STORE_NAME);
                    await store.delete(idToDelete); // Eliminar el registro de IndexedDB
                    alert('Registro eliminado con éxito.');
                    // Después de eliminar, volver a cargar la lista (filtrada o completa)
                    const currentSearchTerm = searchInput.value.toLowerCase().trim();
                    const allPersons = await getPersonas();
                    const filteredPersons = allPersons.filter(persona => {
                        const nameMatch = persona.name && persona.name.toLowerCase().includes(currentSearchTerm);
                        const lastnameMatch = persona.lastname && persona.lastname.toLowerCase().includes(currentSearchTerm);
                        const dniMatch = persona.dni && persona.dni.toLowerCase().includes(currentSearchTerm);
                        const patenteMatch = persona.patente && persona.patente.toLowerCase().includes(currentSearchTerm);
                        const notesMatch = persona.notes && persona.notes.toLowerCase().includes(currentSearchTerm);
                        return nameMatch || lastnameMatch || dniMatch || patenteMatch || notesMatch;
                    });

                    if (currentSearchTerm.length > 0) {
                        displayPersonas(searchResultsDiv, filteredPersons, currentSearchTerm);
                        allPersonsListDiv.style.display = 'none';
                    } else {
                        displayPersonas(allPersonsListDiv, allPersons);
                        searchResultsDiv.innerHTML = '';
                        allPersonsListDiv.style.display = 'block';
                    }

                } catch (error) {
                    console.error('Error al eliminar el registro:', error);
                    alert('Error al eliminar el registro.');
                }
            });
        });
    };

    // --- Manejo del formulario de registro de personas y carga de fotos ---

    // Evento para previsualizar la foto seleccionada
    inputPhoto.addEventListener('change', (event) => {
        const file = event.target.files[0]; // Obtiene el primer archivo seleccionado
        if (file) {
            // Validación de tamaño (opcional): Limita las imágenes a 2MB para evitar sobrecargar IndexedDB
            if (file.size > 2 * 1024 * 1024) { // 2 MB en bytes
                alert('La imagen es demasiado grande. Por favor, selecciona una imagen de menos de 2MB.');
                inputPhoto.value = ''; // Limpia el input del archivo
                previewPhoto.src = '#'; // Limpia la vista previa
                previewPhoto.style.display = 'none'; // Oculta la vista previa
                photoBase64 = null; // Resetea la variable de la foto
                return; // Sale de la función
            }

            const reader = new FileReader(); // Crea un lector de archivos
            reader.onload = (e) => {
                previewPhoto.src = e.target.result; // Establece la fuente de la imagen de vista previa
                previewPhoto.style.display = 'block'; // Muestra la imagen de vista previa
                photoBase64 = e.target.result; // Almacena la imagen en formato Base64
            };
            reader.readAsDataURL(file); // Lee el archivo como una URL de datos (Base64)
        } else {
            // Si no se selecciona ningún archivo, limpia y oculta la vista previa
            previewPhoto.src = '#';
            previewPhoto.style.display = 'none';
            photoBase64 = null;
        }
    });

    // Evento para enviar el formulario de registro de personas
    personForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evita el comportamiento por defecto del formulario (recargar la página)

        // Obtener los valores de todos los campos del formulario
        const name = document.getElementById('person-name').value.trim();
        const lastname = document.getElementById('person-lastname').value.trim();
        const dni = document.getElementById('person-dni').value.trim();
        const patente = document.getElementById('person-patente').value.trim();
        const address = document.getElementById('person-address').value.trim();
        const age = document.getElementById('person-age').value.trim();
        const phone = document.getElementById('person-phone').value.trim();
        const notes = document.getElementById('person-notes').value.trim();

        // Validar campos requeridos
        if (!name || !lastname || !dni) {
            alert('Nombre, Apellido y DNI son campos obligatorios.');
            return; // Detiene la ejecución si faltan campos requeridos
        }

        // Crear el objeto 'nuevaPersona' con todos los datos
        const nuevaPersona = {
            name: name,
            lastname: lastname,
            dni: dni,
            patente: patente,
            address: address,
            age: age ? parseInt(age) : null, // Convierte la edad a número o null si está vacía
            phone: phone,
            notes: notes,
            photo: photoBase64, // La foto en Base64
            timestamp: new Date().toISOString() // Marca de tiempo de creación
        };

        try {
            await addPersona(nuevaPersona); // Guarda la nueva persona en IndexedDB
            personForm.reset(); // Limpia el formulario
            previewPhoto.src = '#'; // Limpia la vista previa de la foto
            previewPhoto.style.display = 'none';
            photoBase64 = null; // Resetea la variable de la foto
            
            // Al guardar, limpiamos el buscador y mostramos toda la lista actualizada.
            searchInput.value = '';
            const allPersons = await getPersonas();
            displayPersonas(allPersonsListDiv, allPersons); // Mostrar en la lista de todas las personas
            searchResultsDiv.innerHTML = ''; // Limpiar resultados de búsqueda
            allPersonsListDiv.style.display = 'block'; // Asegurarse de que la lista completa sea visible
            alert('Persona registrada con éxito!'); // Notificación de éxito
        } catch (error) {
            alert('Error al guardar el registro. Consulta la consola para más detalles.');
            console.error(error);
        }
    });

    // --- Lógica del buscador de personas ---
    searchInput.addEventListener('input', async () => {
        const searchTerm = searchInput.value.toLowerCase().trim(); // Obtiene el término de búsqueda y lo normaliza
        const allPersons = await getPersonas(); // Obtiene todas las personas de la DB

        if (searchTerm.length > 0) {
            // Filtra las personas que coinciden con el término de búsqueda en varios campos
            const filteredPersons = allPersons.filter(persona => {
                const nameMatch = persona.name && persona.name.toLowerCase().includes(searchTerm);
                const lastnameMatch = persona.lastname && persona.lastname.toLowerCase().includes(searchTerm);
                const dniMatch = persona.dni && persona.dni.toLowerCase().includes(searchTerm);
                const patenteMatch = persona.patente && persona.patente.toLowerCase().includes(searchTerm);
                const notesMatch = persona.notes && persona.notes.toLowerCase().includes(searchTerm);
                
                return nameMatch || lastnameMatch || dniMatch || patenteMatch || notesMatch;
            });
            displayPersonas(searchResultsDiv, filteredPersons, searchTerm); // Muestra los resultados filtrados
            allPersonsListDiv.style.display = 'none'; // Oculta la lista completa
        } else {
            // Si el buscador está vacío, muestra toda la lista de personas
            displayPersonas(allPersonsListDiv, allPersons); // Muestra la lista completa
            searchResultsDiv.innerHTML = ''; // Limpia los resultados de búsqueda anteriores
            allPersonsListDiv.style.display = 'block'; // Asegura que la lista completa sea visible
        }
    });

    // --- Funcionalidad de Archivos y Documentos (PDFs pre-cargados por el desarrollador) ---
    // Define un array de objetos con la información de los PDFs.
    // Asegúrate de que los archivos existan en la carpeta 'PDF APPS/' de tu proyecto.
    const preloadedPdfs = [
        { name: 'Código de Convivencia Ley 12.774', file: 'CODIGO DE CONVIVENCIA LEY 12.774.pdf', topic: 'Leyes y Normativas' },
        { name: 'Ley 24.449 Nacional de Tránsito', file: 'LEY_24.449_NACIONAL_DE_TRANSITO_TEXTO_ACTUALIZADO.pdf', topic: 'Leyes y Normativas' },
        // Puedes añadir más objetos PDF aquí siguiendo el mismo formato
        // { name: 'Otro Documento', file: 'otro_documento.pdf', topic: 'Manuales' },
    ];

    // Función para renderizar (mostrar) la lista de PDFs pre-cargados en la interfaz
    function renderPreloadedPdfs() {
        const pdfListDiv = document.getElementById('pdf-list'); // Obtiene el contenedor de la lista de PDFs
        pdfListDiv.innerHTML = ''; // Limpia el contenido anterior del contenedor de PDFs

        if (preloadedPdfs.length === 0) {
            pdfListDiv.innerHTML = '<p>No hay documentos disponibles en este momento.</p>';
            return;
        }

        // Agrupa los PDFs por su 'topic' (tema)
        const groupedPdfs = preloadedPdfs.reduce((acc, pdf) => {
            const topic = pdf.topic || 'Sin tema';
            if (!acc[topic]) {
                acc[topic] = [];
            }
            acc[topic].push(pdf);
            return acc;
        }, {});

        // Itera sobre cada tema y sus PDFs para mostrarlos
        for (const topic in groupedPdfs) {
            const topicDiv = document.createElement('div');
            topicDiv.classList.add('pdf-topic-group');
            topicDiv.innerHTML = `<h3>${topic}</h3>`;

            groupedPdfs[topic].forEach(pdf => {
                const pdfItem = document.createElement('div');
                pdfItem.classList.add('pdf-item');
                // La ruta a tus PDFs debe ser correcta. Si están en 'PDF APPS/', usa esa ruta.
                // Asegúrate que la ruta sea absoluta desde la raíz del repositorio.
                pdfItem.innerHTML = `
                    <a href="/APPpolicial4/PDF APPS/${pdf.file}" target="_blank">${pdf.name}</a>
                `;
                topicDiv.appendChild(pdfItem);
            });
            pdfListDiv.appendChild(topicDiv);
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
        const phoneListDiv = document.getElementById('phone-list'); // Obtiene el contenedor
        phoneListDiv.innerHTML = ''; // Limpia el contenido anterior

        if (importantPhones.length === 0) {
            phoneListDiv.innerHTML = '<p>No hay teléfonos útiles disponibles.</p>';
            return;
        }

        importantPhones.forEach(item => {
            const phoneItem = document.createElement('div');
            phoneItem.classList.add('phone-item');
            phoneItem.innerHTML = `
                <span>${item.name}:</span>
                <a href="tel:${item.phone}">${item.phone}</a>
            `;
            phoneListDiv.appendChild(phoneItem);
        });
    }

    // --- Lógica de navegación de secciones (adaptada a los nuevos data-target y IDs) ---
    // Itera sobre cada botón de navegación para añadir un "escuchador de eventos"
    navButtons.forEach(button => {
        button.addEventListener('click', async () => { // Hacemos async para IndexedDB
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
            } else if (targetId === 'data-section') {
                // Si la sección es la de Base de Datos, aseguramos que la DB esté abierta
                // y luego mostramos todas las personas.
                await openDB(); 
                const allPersons = await getPersonas();
                displayPersonas(allPersonsListDiv, allPersons); // Mostrar todas las personas al entrar en la sección de BD
                searchInput.value = ''; // Limpiar buscador al entrar
                searchResultsDiv.innerHTML = ''; // Limpiar resultados de búsqueda
                allPersonsListDiv.style.display = 'block'; // Asegurarse de que la lista completa sea visible
            } else if (targetId === 'pdf-section') {
                renderPreloadedPdfs(); // Carga los PDFs si se va a esa sección
            }
            // Para 'home-section' no se necesita lógica adicional aquí si el contenido es estático
        });
    });


    // --- Inicialización al cargar la PWA ---
    // Abre la base de datos IndexedDB al inicio.
    openDB().then(() => {
        console.log('IndexedDB inicializada y lista.');
        // Si la sección de Base de Datos es la activa al cargar (ej. por un enlace directo),
        // se cargarán las personas.
        if (document.getElementById('data-section').classList.contains('active')) {
            getPersonas().then(persons => displayPersonas(allPersonsListDiv, persons));
        }
    }).catch(error => {
        console.error("No se pudo inicializar la base de datos:", error);
    });

    // Llama a estas funciones para que la información se muestre cuando la PWA se inicia
    // (Esto es para asegurar que si se carga la página directamente en estas secciones,
    // el contenido se muestre. La lógica de navegación también los llama).
    renderPreloadedPdfs(); // Muestra los PDFs pre-cargados
    loadImportantPhones(); // Muestra los teléfonos importantes

    // Establece la sección de Inicio como activa por defecto al cargar la PWA
    document.getElementById('home-section').classList.add('active');
    // Marca el botón 'Inicio' como activo por defecto
    document.querySelector('.nav-button[data-target="home-section"]').classList.add('active');

    // El registro del Service Worker se ha movido al index.html para una mejor separación.
    // Asegúrate de que el script del Service Worker esté en tu index.html con la ruta correcta.
}); // Fin de DOMContentLoaded