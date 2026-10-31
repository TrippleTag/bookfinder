
/* =========================
   BOOKFINDER - APPLICATION
========================= */

// DATOS DE DEMOSTRACIÓN

const initialBooks = [
    {
        id: "book-1",
        name: "Matemáticas 3 ESO",
        subject: "Matemáticas",
        course: "3 ESO",
        publisher: "Santillana",
        isbn: ""
    },
    {
        id: "book-2",
        name: "Lengua Castellana 3 ESO",
        subject: "Lengua",
        course: "3 ESO",
        publisher: "Anaya",
        isbn: ""
    },
    {
        id: "book-3",
        name: "Tecnología 3 ESO",
        subject: "Tecnología",
        course: "3 ESO",
        publisher: "SM",
        isbn: ""
    }
];

const initialExercises = [
    {
        id: "ex-1",
        bookId: "book-1",
        page: 57,
        number: "12",
        topic: "Ecuaciones",
        description: "Resolver ecuaciones de segundo grado."
    },
    {
        id: "ex-2",
        bookId: "book-1",
        page: 42,
        number: "8",
        topic: "Fracciones",
        description: "Operaciones combinadas con fracciones."
    },
    {
        id: "ex-3",
        bookId: "book-2",
        page: 83,
        number: "5",
        topic: "Gramática",
        description: "Identificar los complementos de las oraciones."
    },
    {
        id: "ex-4",
        bookId: "book-3",
        page: 31,
        number: "3",
        topic: "Electricidad",
        description: "Circuitos eléctricos y ley de Ohm."
    }
];

// BASE DE DATOS LOCAL

function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : fallback;
    } catch {
        return fallback;
    }
}

let books = loadData("bf_books", initialBooks);
let exercises = loadData("bf_exercises", initialExercises);

function saveData() {
    localStorage.setItem("bf_books", JSON.stringify(books));
    localStorage.setItem("bf_exercises", JSON.stringify(exercises));
}

// UTILIDADES

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function normalize(text) {
    return String(text ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(window.toastTimeout);

    window.toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// NAVEGACIÓN

function showPage(page) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active");
    });

    document.getElementById(page).classList.add("active");

    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === page
        );
    });

    if (page === "library") renderLibrary();
    if (page === "admin") renderAdmin();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ESTADÍSTICAS

function updateStats() {
    const subjects = new Set(
        books.map(book => normalize(book.subject))
    );

    document.getElementById("homeBookCount").textContent = books.length;
    document.getElementById("homeExerciseCount").textContent = exercises.length;
    document.getElementById("homeSubjectCount").textContent = subjects.size;

    document.getElementById("adminBookCount").textContent = books.length;
    document.getElementById("adminExerciseCount").textContent = exercises.length;
}

// ICONOS DE ASIGNATURAS

function getSubjectIcon(subject) {
    const value = normalize(subject);

    if (value.includes("mate")) return "∑";
    if (value.includes("lengua")) return "A";
    if (value.includes("ingles")) return "EN";
    if (value.includes("tecnologia")) return "⌘";
    if (value.includes("fisica")) return "Φ";
    if (value.includes("quimica")) return "⚗";
    if (value.includes("historia")) return "◷";
    if (value.includes("biologia")) return "⌬";

    return "B";
}

// TARJETA DE LIBRO

function createBookCard(book) {
    const count = exercises.filter(
        exercise => exercise.bookId === book.id
    ).length;

    return `
        <article class="book-card">
            <div class="book-icon">
                ${escapeHTML(getSubjectIcon(book.subject))}
            </div>

            <h3>${escapeHTML(book.name)}</h3>

            <p>
                ${escapeHTML(book.subject)}
                · ${escapeHTML(book.course || "Curso no indicado")}
            </p>

            <div class="book-meta">
                <span>${escapeHTML(book.publisher || "Sin editorial")}</span>
                <span>${count} ejercicios</span>
            </div>
        </article>
    `;
}

// INICIO

function renderHome() {
    updateStats();

    const container = document.getElementById("homeBooks");

    if (books.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Biblioteca vacía</h3>
                <p>Aún no hay libros registrados.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = books
        .slice(0, 3)
        .map(createBookCard)
        .join("");
}

// BIBLIOTECA

function renderLibrary() {
    const container = document.getElementById("libraryBooks");
    const search = normalize(
        document.getElementById("librarySearch").value
    );

    const filter = document.getElementById("subjectFilter").value;

    const subjects = [...new Set(books.map(book => book.subject))];

    document.getElementById("subjectFilter").innerHTML = `
        <option value="all">Todas las asignaturas</option>
        ${subjects.map(subject => `
            <option value="${escapeHTML(subject)}">
                ${escapeHTML(subject)}
            </option>
        `).join("")}
    `;

    // Restaurar filtro si sigue existiendo
    const select = document.getElementById("subjectFilter");

    if (subjects.includes(filter)) {
        select.value = filter;
    } else {
        select.value = "all";
    }

    const filtered = books.filter(book => {
        const matchesSearch = normalize(
            `${book.name} ${book.subject} ${book.course} ${book.publisher}`
        ).includes(search);

        const matchesSubject =
            select.value === "all" || book.subject === select.value;

        return matchesSearch && matchesSubject;
    });

    container.innerHTML = filtered.length
        ? filtered.map(createBookCard).join("")
        : `
            <div class="empty-state">
                <h3>No se encontraron libros</h3>
                <p>Prueba con otro nombre o asignatura.</p>
            </div>
        `;
}

// BÚSQUEDA DE EJERCICIOS

function searchBooks() {
    const query = normalize(
        document.getElementById("mainSearch").value
    );

    if (!query) {
        showToast("Escribe algo para buscar.");
        return;
    }

    const words = query.split(/\s+/).filter(Boolean);

    const results = exercises.map(exercise => {
        const book = books.find(b => b.id === exercise.bookId);

        if (!book) return null;

        const searchableText = normalize(`
            ${book.name}
            ${book.subject}
            ${book.course}
            ${exercise.topic}
            ${exercise.description}
            ${exercise.page}
            ${exercise.number}
        `);

        const matches = words.filter(word =>
            searchableText.includes(word)
        );

        return {
            exercise,
            book,
            score: matches.length / words.length
        };
    }).filter(result => result && result.score > 0)
      .sort((a, b) => b.score - a.score);

    renderResults(results, query);
    showPage("results");
}

function quickSearch(query) {
    document.getElementById("mainSearch").value = query;
    searchBooks();
}

// MOSTRAR RESULTADOS

function renderResults(results, query) {
    const container = document.getElementById("resultsList");

    document.getElementById("resultsDescription").textContent =
        `${results.length} coincidencias para "${query}".`;

    if (results.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No hemos encontrado resultados.</h3>
                <p>Prueba con otros términos o comprueba que el ejercicio esté indexado.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = results.map(result => {
        const ex = result.exercise;
        const book = result.book;

        return `
            <article class="result-card">
                <div>
                    <h3>${escapeHTML(ex.topic || "Ejercicio sin tema")}</h3>

                    <p>
                        ${escapeHTML(book.name)}
                        · ${escapeHTML(book.subject)}
                    </p>

                    <p>
                        ${escapeHTML(ex.description || "Sin descripción")}
                    </p>
                </div>

                <div class="result-location">
                    Pág. ${escapeHTML(ex.page)}
                    · Ej. ${escapeHTML(ex.number)}
                </div>
            </article>
        `;
    }).join("");
}

// ADMINISTRACIÓN

function renderAdmin() {
    updateStats();

    const select = document.getElementById("exerciseBook");

    const previousValue = select.value;

    select.innerHTML = `
        <option value="">Selecciona un libro</option>
        ${books.map(book => `
            <option value="${escapeHTML(book.id)}">
                ${escapeHTML(book.name)}
            </option>
        `).join("")}
    `;

    if (books.some(book => book.id === previousValue)) {
        select.value = previousValue;
    }

    const container = document.getElementById("adminBookList");

    if (books.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No hay libros</h3>
                <p>Añade tu primer libro usando el formulario.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = books.map(book => {
        const count = exercises.filter(
            ex => ex.bookId === book.id
        ).length;

        return `
            <div class="registered-book">
                <div>
                    <strong>${escapeHTML(book.name)}</strong>
                    <small>
                        ${escapeHTML(book.subject)}
                        · ${count} ejercicios
                    </small>
                </div>

                <button
                    class="delete-button"
                    onclick="deleteBook('${escapeHTML(book.id)}')"
                >
                    Eliminar
                </button>
            </div>
        `;
    }).join("");
}

// AÑADIR LIBRO

document.getElementById("bookForm").addEventListener("submit", event => {
    event.preventDefault();

    const book = {
        id: "book-" + Date.now(),
        name: document.getElementById("bookName").value.trim(),
        subject: document.getElementById("bookSubject").value.trim(),
        course: document.getElementById("bookCourse").value.trim(),
        publisher: document.getElementById("bookPublisher").value.trim(),
        isbn: document.getElementById("bookISBN").value.trim()
    };

    books.push(book);

    saveData();
    event.target.reset();

    renderAdmin();
    renderHome();

    showToast("Libro añadido correctamente.");
});

// AÑADIR EJERCICIO

document.getElementById("exerciseForm").addEventListener("submit", event => {
    event.preventDefault();

    const exercise = {
        id: "ex-" + Date.now(),
        bookId: document.getElementById("exerciseBook").value,
        page: Number(document.getElementById("exercisePage").value),
        number: document.getElementById("exerciseNumber").value.trim(),
        topic: document.getElementById("exerciseTopic").value.trim(),
        description: document.getElementById("exerciseDescription").value.trim()
    };

    if (!books.some(book => book.id === exercise.bookId)) {
        showToast("Selecciona un libro válido.");
        return;
    }

    exercises.push(exercise);

    saveData();
    event.target.reset();

    renderAdmin();
    renderHome();

    showToast("Ejercicio añadido correctamente.");
});

// ELIMINAR LIBRO

function deleteBook(id) {
    const book = books.find(item => item.id === id);

    if (!book) return;

    if (!confirm(`¿Quieres eliminar "${book.name}" y sus ejercicios?`)) {
        return;
    }

    books = books.filter(item => item.id !== id);
    exercises = exercises.filter(item => item.bookId !== id);

    saveData();

    renderAdmin();
    renderHome();

    showToast("Libro eliminado.");
}

// INICIALIZACIÓN

document.addEventListener("DOMContentLoaded", () => {
    renderHome();
    renderAdmin();
});
