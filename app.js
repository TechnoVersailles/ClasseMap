document.addEventListener('DOMContentLoaded', () => {
    const csvInput = document.getElementById('csvInput');
    const studentsContainer = document.getElementById('students-container');
    const roomSvg = document.getElementById('roomSvg');
    const roomContainer = document.getElementById('room-container');
    const roomWidthInput = document.getElementById('roomWidth');
    const roomHeightInput = document.getElementById('roomHeight');
    const studentList = document.getElementById('student-list');
    const toggleStudentList = document.getElementById('toggle-student-list');
    const btnAddGroup = document.getElementById('btnAddGroup');
    const btnAutoGroup = document.getElementById('btnAutoGroup');
    const btnResetGroups = document.getElementById('btnResetGroups');

    // Nouveaux éléments pour les templates
    const btnTabClasses = document.getElementById('btn-tab-classes');
    const btnTabTemplate = document.getElementById('btn-tab-template');
    const btnTabData = document.getElementById('btn-tab-data');
    const controlsClasses = document.getElementById('controls-classes');
    const controlsTemplate = document.getElementById('controls-template');
    const controlsData = document.getElementById('controls-data');
    
    const btnAddTable = document.getElementById('btnAddTable');
    const btnSaveTemplate = document.getElementById('btnSaveTemplate');
    const btnClearTemplate = document.getElementById('btnClearTemplate');
    const btnDeleteTemplate = document.getElementById('btnDeleteTemplate');
    const newTemplateName = document.getElementById('newTemplateName');
    const templateSelect = document.getElementById('templateSelect');
    const templateSelectEdit = document.getElementById('templateSelectEdit');
    const tableWidthInput = document.getElementById('tableWidth');
    const tableHeightInput = document.getElementById('tableHeight');
    const btnRotateTable = document.getElementById('btnRotateTable');
    const btnZoomIn = document.getElementById('btnZoomIn');
    const btnZoomOut = document.getElementById('btnZoomOut');
    const zoomLevelDisplay = document.getElementById('zoomLevelDisplay');
    const btnExportData = document.getElementById('btnExportData');
    const btnPanTool = document.getElementById('btnPanTool');
    const btnToggleInfo = document.getElementById('btnToggleInfo');
    const btnToggleAllGroups = document.getElementById('btnToggleAllGroups');
    const btnToggleGroups = document.getElementById('btnToggleGroups');
    const btnToggleStudents = document.getElementById('btnToggleStudents');
    const btnToggleIcons = document.getElementById('btnToggleIcons');
    const btnToggleNames = document.getElementById('btnToggleNames');
    const roomTitle = document.getElementById('roomTitle');
    const dropZone = document.getElementById('dropZone');
    const btnLoadDemo = document.getElementById('btnLoadDemo');
    const btnResetAll = document.getElementById('btnResetAll');
    
    // Contrôles Classes
    const classSelect = document.getElementById('classSelect');
    const btnAddClass = document.getElementById('btnAddClass');
    const btnDeleteClass = document.getElementById('btnDeleteClass');

    // Nouveaux contrôles Salle
    const btnAddRoundTable = document.getElementById('btnAddRoundTable');
    const btnAddComputer = document.getElementById('btnAddComputer');
    const btnAddSeparator = document.getElementById('btnAddSeparator');
    const itemColorInput = document.getElementById('itemColor');
    const floorColorInput = document.getElementById('floorColor');
    const metaKeyInput = document.getElementById('metaKey');
    const metaValueInput = document.getElementById('metaValue');
    const metaDisplayInput = document.getElementById('metaDisplay');
    const metaModeSelect = document.getElementById('metaMode');

    let selectedElement = null;
    let offset = { x: 0, y: 0 };
    let currentMode = 'classes'; // 'classes', 'template', 'data'
    let templates = JSON.parse(localStorage.getItem('classroomTemplates')) || {};
    let classes = JSON.parse(localStorage.getItem('classroomClasses')) || {};
    let currentClass = null;
    let selectedElements = []; // Remplacer selectedTable par un tableau
    let selectedTable = null;
    let zoomLevel = 1;
    let currentTool = 'select'; // 'select', 'pan'
    let isPanning = false;
    let isDragging = false;
    let panStart = { x: 0, y: 0 };
    let scrollStart = { x: 0, y: 0 };

    const DISPLAY_SCALE = 0.1; // 1mm = 0.1px pour l'affichage écran

    // Initialiser la liste des templates
    updateTemplateSelect();
    updateClassSelect();

    // --- Gestion de la configuration de la salle ---

    function updateRoomSize() {
        const w = parseInt(roomWidthInput.value) || 7000;
        const h = parseInt(roomHeightInput.value) || 8000;
        roomSvg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        roomSvg.setAttribute('width', w * DISPLAY_SCALE * zoomLevel);
        roomSvg.setAttribute('height', h * DISPLAY_SCALE * zoomLevel);

        if (currentClass && classes[currentClass]) {
            classes[currentClass].roomWidth = w;
            classes[currentClass].roomHeight = h;
            classes[currentClass].floorColor = floorColorInput.value;
            localStorage.setItem('classroomClasses', JSON.stringify(classes));
        }
    }

    roomWidthInput.addEventListener('input', updateRoomSize);
    roomHeightInput.addEventListener('input', updateRoomSize);

    floorColorInput.addEventListener('input', (e) => {
        roomSvg.style.backgroundColor = e.target.value;
        updateRoomSize();
    });

    // --- Gestion de l'import CSV ---

    csvInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            processCSV(text);
        };
        reader.readAsText(file);
    });

    function processCSV(text) {
        studentsContainer.innerHTML = ''; // Reset liste
        // Séparer par lignes, gérer les retours chariot Windows/Unix
        const lines = text.split(/\r\n|\n/);
        const studentsByGroup = {};
        const defaultGroup = "Master";
        
        lines.forEach((line, index) => {
            if (!line.trim()) return;
            
            // Supporte séparateur virgule ou point-virgule
            // On filtre les éléments vides pour gérer le cas "Nom;Prénom;" qui crée un 3ème élément vide
            const parts = line.split(/,|;/).map(p => p.trim());
            if (parts.length >= 2) {
                const nom = parts[0];
                const prenom = parts[1];
                
                // Ignorer l'en-tête CSV (Nom;Prénom)
                if (nom.toLowerCase() === 'nom' && (prenom.toLowerCase() === 'prénom' || prenom.toLowerCase() === 'prenom')) return;

                // Si le 3ème champ existe et n'est pas vide, on l'utilise, sinon defaultGroup
                const groupe = (parts.length > 2 && parts[2] !== "") ? parts[2] : defaultGroup;

                if (!studentsByGroup[groupe]) {
                    studentsByGroup[groupe] = [];
                }
                studentsByGroup[groupe].push({ nom, prenom, id: index, groupe });
            }
        });

        // Affichage par groupes
        for (const [groupName, students] of Object.entries(studentsByGroup)) {
            const { block, listContainer } = createGroupBlock(groupName);
            studentsContainer.appendChild(block);

            students.forEach(s => {
                const item = createSidebarStudent(s.nom, s.prenom, s.id, s.groupe);
                listContainer.appendChild(item);
            });
        }
    }

    function findSvgGroupByName(name) {
        const groups = roomSvg.querySelectorAll('.svg-group');
        for (let i = 0; i < groups.length; i++) {
            if (groups[i].dataset.groupName === name) return groups[i];
        }
        return null;
    }

    function layoutGroupStudents(group) {
        const shape = group.dataset.shape || 'rect';
        // On trie les élèves par nom pour garder un ordre stable même si le DOM change (hover)
        const students = Array.from(group.querySelectorAll('.svg-student')).sort((a, b) => {
            const nameA = (a.dataset.nom + a.dataset.prenom).toLowerCase();
            const nameB = (b.dataset.nom + b.dataset.prenom).toLowerCase();
            return nameA.localeCompare(nameB);
        });
        const count = students.length;
        
        const studentW = 800;
        const studentH = 400;
        const gap = 50;
        
        // Nettoyage des formes de fond existantes
        const oldBg = group.querySelector('.group-bg');
        if (oldBg) oldBg.remove();

        let width, height, bgShape;

        if (shape === 'circle') {
            // Disposition en cercle ou grille centrée ? 
            // Pour optimiser l'espace, une grille centrée dans un cercle est souvent mieux
            const cols = Math.ceil(Math.sqrt(count));
            const rows = Math.ceil(count / cols);
            
            const gridW = cols * studentW + (cols - 1) * gap;
            const gridH = rows * studentH + (rows - 1) * gap;
            
            // Rayon nécessaire pour contenir la grille (hypoténuse)
            const radius = Math.sqrt(Math.pow(gridW, 2) + Math.pow(gridH, 2)) / 2 + gap;
            
            // Création du cercle de fond
            bgShape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            bgShape.setAttribute('r', radius);
            bgShape.setAttribute('cx', gridW / 2);
            bgShape.setAttribute('cy', gridH / 2);
            
            // Placement des élèves
            students.forEach((student, i) => {
                const col = i % cols;
                const row = Math.floor(i / cols);
                const x = col * (studentW + gap);
                const y = row * (studentH + gap);
                student.setAttribute('transform', `translate(${x}, ${y})`);
            });

            width = gridW; // Pour le positionnement du titre
            height = gridH; // Pour le positionnement du titre (approximatif par rapport au centre)
            
            // Ajustement visuel : le groupe SVG commence à 0,0. 
            // Le cercle déborde en négatif si on centre sur 0,0. Ici on a centré le cercle sur la grille.

        } else {
            // Rectangle ou Carré
            let cols = 3; // Défaut Rectangle
            if (shape === 'square') {
                cols = Math.ceil(Math.sqrt(count));
            }
            
            // Calculer dimensions
            const numCols = Math.min(count, cols) || 1;
            const numRows = Math.ceil(count / cols) || 1;
            
            width = numCols * studentW + (numCols + 1) * gap;
            height = numRows * studentH + (numRows + 1) * gap;

            bgShape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            bgShape.setAttribute('width', width);
            bgShape.setAttribute('height', height);
            bgShape.setAttribute('rx', 50);
            bgShape.setAttribute('ry', 50);

            let currentX = gap;
            let currentY = gap;
            
            students.forEach((student, i) => {
                if (i > 0 && i % cols === 0) {
                    currentX = gap;
                    currentY += studentH + gap;
                }
                student.setAttribute('transform', `translate(${currentX}, ${currentY})`);
                currentX += studentW + gap;
            });
        }

        // Ajout du fond en premier plan (derrière les élèves grâce à prepend)
        bgShape.classList.add('group-bg');
        bgShape.style.fill = 'rgba(236, 240, 241, 0.4)';
        bgShape.style.stroke = '#bdc3c7';
        bgShape.style.strokeWidth = '5';
        bgShape.style.stroke =  'rgb(46 233 71)';
        bgShape.style.strokeWidth = '25';
        group.prepend(bgShape);

        // Mise à jour position titre
        const titleText = group.querySelector('.group-title');
        if (titleText) {
            // Centré horizontalement, positionné au-dessus
            let centerX = (shape === 'circle') ? (width / 2) : (width / 2);
            let topY = (shape === 'circle') ? (height / 2 - parseFloat(bgShape.getAttribute('r'))) : 0;
            
            titleText.setAttribute('x', centerX);
            titleText.setAttribute('y', topY - 50); // 50px au dessus
        }
    }

    function createGroupBlock(name) {
        const block = document.createElement('div');
        block.className = 'group-block';
        
        const header = document.createElement('div');
        header.className = 'student-group-title';
        header.draggable = true;

        // Vérifier si le groupe est déjà placé sur le plan pour colorer l'en-tête
        if (findSvgGroupByName(name)) {
            header.classList.add('placed');
        }
        
        const icon = document.createElement('span');
        icon.textContent = '📁';
        icon.style.marginRight = '10px';
        
        const textSpan = document.createElement('span');
        textSpan.textContent = name;
        textSpan.style.flexGrow = '1';

        const toggleBtn = document.createElement('span');
        toggleBtn.className = 'toggle-icon';
        toggleBtn.textContent = '▼';

        header.appendChild(icon);
        header.appendChild(textSpan);

        if (name !== 'Master') {
            const deleteBtn = document.createElement('span');
            deleteBtn.textContent = '🗑️';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.style.marginRight = '10px';
            deleteBtn.title = "Supprimer le groupe";
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Supprimer le groupe "${name}" et transférer les élèves vers Master ?`)) {
                    // 1. Déplacer les élèves de la sidebar vers Master
                    let masterList = document.querySelector('.group-items[data-group-name="Master"]');
                    if (!masterList) {
                        const masterGroup = createGroupBlock("Master");
                        studentsContainer.prepend(masterGroup.block);
                        masterList = masterGroup.listContainer;
                    }

                    Array.from(listContainer.querySelectorAll('.student-item')).forEach(item => {
                        item.dataset.groupe = "Master";
                        masterList.appendChild(item);
                    });
                    
                    // 2. Gérer les élèves sur le plan (SVG)
                    const groupSvg = findSvgGroupByName(name);
                    if (groupSvg) {
                        let masterSvg = findSvgGroupByName("Master");
                        if (!masterSvg) {
                            // Créer le groupe Master à la position du groupe supprimé
                            const transform = groupSvg.transform.baseVal.getItem(0);
                            const x = transform.matrix.e;
                            const y = transform.matrix.f;
                            createSvgGroup("Master", [], x, y, null, 'rect');
                            masterSvg = findSvgGroupByName("Master");
                        }

                        groupSvg.querySelectorAll('.svg-student').forEach(s => {
                            const sData = { nom: s.dataset.nom, prenom: s.dataset.prenom, id: s.dataset.id };
                            s.remove();
                            if (masterSvg) {
                                createSvgStudent(sData.nom, sData.prenom, 0, 0, sData.id, "Master", masterSvg);
                            }
                        });
                        if (masterSvg) layoutGroupStudents(masterSvg);
                        groupSvg.remove();
                    }
                    
                    block.remove();
                }
            });
            header.appendChild(deleteBtn);
        }

        header.appendChild(toggleBtn);

        const listContainer = document.createElement('div');
        listContainer.className = 'group-items';
        listContainer.dataset.groupName = name;

        // Gestion du Toggle (Plier/Déplier)
        header.addEventListener('click', (e) => {
            listContainer.classList.toggle('hidden');
            toggleBtn.textContent = listContainer.classList.contains('hidden') ? '▶' : '▼';
        });

        // Gestion du Drop sur le titre du groupe pour y déplacer un élève
        header.addEventListener('dragover', (e) => {
            e.preventDefault();
            header.classList.add('dragover');
        });
        header.addEventListener('dragleave', () => {
            header.classList.remove('dragover');
        });
        header.addEventListener('drop', (e) => {
            e.preventDefault();
            header.classList.remove('dragover');
            handleDropOnGroup(e, listContainer, name);
        });

        // Gestion du Drop directement dans la liste
        listContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            listContainer.classList.add('dragover');
        });
        listContainer.addEventListener('dragleave', () => {
            listContainer.classList.remove('dragover');
        });
        listContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            listContainer.classList.remove('dragover');
            handleDropOnGroup(e, listContainer, name);
        });

        // Gestion du Drag du groupe entier vers la salle (inchangé)
        header.addEventListener('dragstart', (e) => {
            // Récupérer tous les élèves de ce groupe actuellement dans la sidebar
            const students = [];
            listContainer.querySelectorAll('.student-item').forEach(item => {
                students.push({
                    id: item.dataset.id,
                    nom: item.dataset.nom,
                    prenom: item.dataset.prenom,
                    groupe: name
                });
            });
            e.dataTransfer.setData('text/plain', JSON.stringify({
                type: 'group',
                groupName: name,
                students: students
            }));
        });

        // Renommage du groupe
        header.addEventListener('dblclick', (e) => {
            e.stopPropagation(); // Empêcher le toggle
            const newName = prompt("Renommer le groupe :", name);
            if (newName && newName !== name) {
                const oldName = name;
                name = newName;
                textSpan.textContent = newName;
                listContainer.dataset.groupName = newName;
                
                // Mettre à jour le groupe des élèves dans la liste
                listContainer.querySelectorAll('.student-item').forEach(item => {
                    item.dataset.groupe = newName;
                });

                const placedGroup = findSvgGroupByName(oldName);
                if (placedGroup) {
                    placedGroup.dataset.groupName = newName;
                    placedGroup.dataset.metaValue = newName;
                    updateObjectMetadata(placedGroup);
                    placedGroup.querySelectorAll('.svg-student').forEach(s => s.dataset.groupe = newName);
                }
            }
        });

        block.appendChild(header);
        block.appendChild(listContainer);
        
        return { block, listContainer };
    }

    function handleDropOnGroup(e, listContainer, groupName) {
        const data = e.dataTransfer.getData('text/plain');
        if (data) {
            try {
                const studentData = JSON.parse(data);
                if (studentData.type === 'group') return; // On ne drop pas un groupe dans un groupe
                
                const sidebarItem = document.querySelector(`.student-item[data-id="${studentData.id}"]`);
                const oldGroupName = sidebarItem ? sidebarItem.dataset.groupe : studentData.groupe;

                if (sidebarItem) {
                    listContainer.appendChild(sidebarItem);
                    sidebarItem.dataset.groupe = groupName;
                }

                // Mise à jour de la représentation SVG (Plan)
                const svgStudent = roomSvg.querySelector(`.svg-student[data-id="${studentData.id}"]`);
                if (svgStudent) {
                    svgStudent.remove();
                    const oldGroupSvg = findSvgGroupByName(oldGroupName);
                    if (oldGroupSvg) layoutGroupStudents(oldGroupSvg);
                }

                const newGroupSvg = findSvgGroupByName(groupName);
                if (newGroupSvg) {
                    createSvgStudent(studentData.nom, studentData.prenom, 0, 0, studentData.id, groupName, newGroupSvg);
                    layoutGroupStudents(newGroupSvg);
                }
            } catch(err) {
                console.error("Erreur lors du drop sur un groupe :", err);
            }
        }
    }

    function createSidebarStudent(nom, prenom, id, groupe = "") {
        const div = document.createElement('div');
        div.classList.add('student-item');
        div.textContent = `${prenom} ${nom}`;
        div.draggable = true;
        div.dataset.nom = nom;
        div.dataset.prenom = prenom;
        div.dataset.groupe = groupe;
        div.dataset.id = id;

        // Événement début de drag HTML5
        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                nom: nom,
                prenom: prenom,
                groupe: groupe,
                id: id
            }));
            e.dataTransfer.effectAllowed = 'move';
        });

        return div;
    }

    // --- Gestion de l'interface Élèves ---

    toggleStudentList.addEventListener('click', () => {
        studentList.classList.toggle('collapsed');
        const span = toggleStudentList.querySelector('span');
        if (span) span.textContent = studentList.classList.contains('collapsed') ? '▶' : '▼';
    });

    btnAddGroup.addEventListener('click', () => {
        const name = prompt("Nom du nouveau groupe :");
        if (name) {
            const { block } = createGroupBlock(name);
            studentsContainer.prepend(block); // Ajoute au début
        }
    });

    btnResetGroups.addEventListener('click', () => {
        if (!confirm("Tout remettre dans le groupe Master ?")) return;
        
        const uniqueStudents = new Map();

        const addStudent = (id, nom, prenom) => {
            // Utiliser l'ID comme clé pour éviter les doublons
            if (!uniqueStudents.has(String(id))) {
                uniqueStudents.set(String(id), { id, nom, prenom });
            }
        };

        // 1. Récupérer les élèves de la sidebar
        studentsContainer.querySelectorAll('.student-item').forEach(item => {
            addStudent(item.dataset.id, item.dataset.nom, item.dataset.prenom);
        });
        
        // 2. Récupérer les élèves du plan (SVG)
        roomSvg.querySelectorAll('.svg-student').forEach(s => {
            addStudent(s.dataset.id, s.dataset.nom, s.dataset.prenom);
        });
        
        // Vider le conteneur
        studentsContainer.innerHTML = '';
        
        // Supprimer les groupes d'élèves et les élèves du SVG
        roomSvg.querySelectorAll('.svg-group').forEach(g => g.remove());
        roomSvg.querySelectorAll('.svg-student').forEach(s => s.remove());

        // Créer le groupe Master
        const { block, listContainer } = createGroupBlock("Master");
        studentsContainer.appendChild(block);
        
        // Trier par ID pour conserver l'ordre initial
        const sortedStudents = Array.from(uniqueStudents.values()).sort((a, b) => parseInt(a.id) - parseInt(b.id));

        // Ajouter les élèves
        sortedStudents.forEach(s => {
            const item = createSidebarStudent(s.nom, s.prenom, s.id, "Master");
            listContainer.appendChild(item);
        });
    });

    btnAutoGroup.addEventListener('click', () => {
        // Récupérer tous les élèves de la sidebar
        const allItems = Array.from(studentsContainer.querySelectorAll('.student-item'));
        if (allItems.length === 0) return alert("Aucun élève dans la liste à grouper.");

        if (!confirm(`Répartir automatiquement ${allItems.length} élèves en groupes de 3-4 ?`)) return;

        // Mélanger (Algorithme de Fisher-Yates)
        for (let i = allItems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
        }

        // Calculer le nombre de groupes (viser 4 par groupe)
        let numGroups = Math.ceil(allItems.length / 4);
        if (numGroups < 1) numGroups = 1;

        // Vider le conteneur
        studentsContainer.innerHTML = '';

        // Recréer le groupe Master pour ne pas le perdre
        const masterGroup = createGroupBlock("Master");
        studentsContainer.appendChild(masterGroup.block);

        // Créer les groupes et distribuer
        const groupContainers = [];
        for (let i = 1; i <= numGroups; i++) {
            const { block, listContainer } = createGroupBlock(`Groupe ${i}`);
            studentsContainer.appendChild(block);
            groupContainers.push(listContainer);
        }

        allItems.forEach((item, index) => {
            const targetGroup = groupContainers[index % numGroups];
            item.dataset.groupe = targetGroup.dataset.groupName;
            targetGroup.appendChild(item);
        });
    });

    // --- Gestion du Drop dans le SVG (Depuis la sidebar) ---

    roomSvg.addEventListener('dragover', (e) => {
        e.preventDefault(); // Nécessaire pour autoriser le drop
    });

    roomSvg.addEventListener('drop', (e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('text/plain');
        if (!data) return;

        // Convertir les coordonnées de la souris en coordonnées SVG
        const pt = roomSvg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const svgP = pt.matrixTransform(roomSvg.getScreenCTM().inverse());

        const dataObj = JSON.parse(data);

        // Gestion du drop d'un GROUPE
        if (dataObj.type === 'group') {
            const existingGroup = findSvgGroupByName(dataObj.groupName);
            if (existingGroup) {
                // Le groupe existe déjà : on met à jour uniquement sa position (X, Y)
                existingGroup.setAttribute('transform', `translate(${svgP.x}, ${svgP.y})`);
            } else {
                // Le groupe n'existe pas encore visuellement : on l'instancie
                createSvgGroup(dataObj.groupName, dataObj.students, svgP.x, svgP.y, null, 'rect');
            }
            
            return;
        }

        const studentData = dataObj;

        let finalX = svgP.x;
        let finalY = svgP.y;

        // Logique d'aimantation (Snap) aux tables en mode placement
        if (currentMode === 'classes') {
            const tables = roomSvg.querySelectorAll('.svg-table');
            let minDst = Infinity;
            let closest = null;

            tables.forEach(table => {
                // Récupérer les dimensions et la position réelles
                const transform = table.transform.baseVal.getItem(0);
                const tx = transform.matrix.e;
                const ty = transform.matrix.f;
                const w = parseFloat(table.querySelector('rect').getAttribute('width'));
                const h = parseFloat(table.querySelector('rect').getAttribute('height'));
                
                // Centre de la table
                const cx = tx + w / 2;
                const cy = ty + h / 2;
                
                const dist = Math.hypot(svgP.x - cx, svgP.y - cy);
                if (dist < 600 && dist < minDst) { // Seuil de détection (600mm)
                    minDst = dist;
                    closest = { x: cx, y: cy };
                }
            });

            if (closest) {
                // L'élève sera centré sur le point calculé
                finalX = closest.x;
                finalY = closest.y;
            }
        }

        // Éviter les doublons visuels sur le plan (si on déplace un élève déjà présent)
        const existingSvg = roomSvg.querySelector(`.svg-student[data-id="${studentData.id}"]`);
        if (existingSvg) existingSvg.remove();

        createSvgStudent(studentData.nom, studentData.prenom, finalX, finalY, studentData.id, studentData.groupe);

        // On ne supprime plus l'élément de la sidebar pour qu'il reste visible dans la liste
    });

    // --- Création de l'élève SVG ---

    function createSvgStudent(nom, prenom, x, y, id, groupe = "", container = roomSvg) {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute('class', 'svg-student');
        group.setAttribute('transform', `translate(${x - 200}, ${y - 100})`); // Centrer au drop (400x200)
        // Stocker les données pour la sauvegarde
        group.dataset.nom = nom;
        group.dataset.prenom = prenom;
        group.dataset.groupe = groupe;
        group.dataset.id = id;

        // Rectangle de sélection (Invisible par défaut, rouge si sélectionné)
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute('width', '800');
        rect.setAttribute('height', '400');
        rect.setAttribute('rx', '20');
        rect.setAttribute('ry', '20');
        group.appendChild(rect);

        // Icône Élève (SVG fourni)
        const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        icon.setAttribute('viewBox', '0 0 1772 1772');
        icon.setAttribute('width', '800');
        icon.setAttribute('height', '400');
        icon.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        icon.innerHTML = `<g transform="matrix(12.3892,0,0,12.3892,-4123.05,-9238.71)">
            <path d="M404.294,829.358C349.15,829.358 337,888.707 337,888.707L471.588,888.707C471.588,888.707 459.438,829.358 404.294,829.358ZM404.294,745.707C423.638,745.707 439.343,761.412 439.343,780.756C439.343,800.101 423.638,815.805 404.294,815.805C384.95,815.805 369.245,800.101 369.245,780.756C369.245,761.412 384.95,745.707 404.294,745.707Z" style="fill:rgb(156,101,14);"/>
        </g>`;

        // Texte (Prénom) - Toujours visible en bas
        const textPrenom = document.createElementNS("http://www.w3.org/2000/svg", "text");
        textPrenom.setAttribute('x', '400');
        textPrenom.setAttribute('y', '450');
        textPrenom.textContent = prenom;
        textPrenom.classList.add('text-prenom');

        group.appendChild(icon);
        group.appendChild(textPrenom);
        container.appendChild(group);

        // Attacher les événements de souris pour le déplacement interne au SVG
        attachDragEvents(group);

        // Mettre au premier plan au survol
        group.addEventListener('mouseenter', function() {
            this.parentNode.appendChild(this);
        });
    }

    // --- Création du Groupe SVG (Bulle) ---

    function createSvgGroup(name, students, x, y, savedData = null, shape = 'rect') {
        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        // On retire 'svg-table' pour ne pas hériter des comportements de template (métadonnées auto, etc)
        // On gère le titre manuellement
        group.setAttribute('class', 'svg-group'); 
        group.setAttribute('transform', `translate(${x}, ${y})`);
        
        // Métadonnées par défaut ou chargées
        group.dataset.type = 'group';
        group.dataset.shape = savedData ? (savedData.shape || 'rect') : shape;
        group.dataset.groupName = name; // Stockage du nom
        
        if (savedData && savedData.id) group.dataset.groupId = savedData.id;
        else group.dataset.groupId = 'g-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

        // Titre du groupe (Au dessus)
        const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
        title.textContent = name;
        title.classList.add('group-title');
        group.appendChild(title);

        // Interaction : Double clic pour changer la forme
        group.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            const shapes = ['rect', 'square', 'circle'];
            const currentShape = group.dataset.shape || 'rect';
            const nextIndex = (shapes.indexOf(currentShape) + 1) % shapes.length;
            const nextShape = shapes[nextIndex];
            
            group.dataset.shape = nextShape;
            layoutGroupStudents(group);
            if (currentMode === 'classes' && currentClass) saveCurrentClass();
            // Feedback visuel optionnel ou console.log(`Forme changée en : ${nextShape}`);
        });

        // Créer les élèves
        students.forEach(s => {
            createSvgStudent(s.nom, s.prenom, 400, 200, s.id, s.groupe, group);
        });

        roomSvg.appendChild(group);
        layoutGroupStudents(group);
        
        attachDragEvents(group);

        // Mettre à jour l'état dans la sidebar (si elle existe)
        const sidebarHeader = document.querySelector(`.group-items[data-group-name="${name}"]`)?.previousElementSibling;
        if (sidebarHeader) sidebarHeader.classList.add('placed');
    }

    // --- Déplacement des éléments DANS le SVG ---

    function attachDragEvents(element) {
        element.addEventListener('mousedown', startDrag);
    }

    function startDrag(evt) {
        if (currentTool === 'pan') return; // Laisser passer l'événement pour le Pan
        isDragging = false;
        selectedElement = evt.currentTarget; // Le groupe <g>
        
        // Obtenir la position actuelle de la souris
        const pt = getMousePosition(evt);
        
        // Obtenir la transformation actuelle (translate)
        const transforms = selectedElement.transform.baseVal;
        
        // Si c'est la première transformation ou s'il y en a une existante
        // Gestion de la sélection multiple en mode template
        if (selectedElement.classList.contains('svg-student')) {
            clearSelection();
            selectedElement.classList.add('selected');
        }

        if (currentMode === 'template' && selectedElement.classList.contains('svg-table')) {
            const isCtrl = evt.ctrlKey || evt.metaKey;
            
            if (isCtrl) {
                toggleSelection(selectedElement);
            } else {
                if (!selectedElements.includes(selectedElement)) {
                    clearSelection();
                    addToSelection(selectedElement);
                }
                // Si déjà sélectionné et pas de Ctrl, on garde la sélection pour permettre le déplacement du groupe
            }

            // Préparer le décalage pour TOUS les éléments sélectionnés
            selectedElements.forEach(el => {
                const tr = el.transform.baseVal;
                let cx = 0, cy = 0;
                if (tr.length > 0 && tr.getItem(0).type === SVGTransform.SVG_TRANSFORM_TRANSLATE) {
                    cx = tr.getItem(0).matrix.e;
                    cy = tr.getItem(0).matrix.f;
                }
                // On stocke l'offset individuel sur chaque élément
                el.dataset.dragOffsetX = pt.x - cx;
                el.dataset.dragOffsetY = pt.y - cy;
            });

        } else {
            // Comportement standard (élèves)
            let currentX = 0;
            let currentY = 0;
            if (transforms.length > 0 && transforms.getItem(0).type === SVGTransform.SVG_TRANSFORM_TRANSLATE) {
                currentX = transforms.getItem(0).matrix.e;
                currentY = transforms.getItem(0).matrix.f;
            }
            offset.x = pt.x - currentX;
            offset.y = pt.y - currentY;
        }
    }

    roomSvg.addEventListener('mousemove', (evt) => {
        if (selectedElement) {
            isDragging = true;
            evt.preventDefault();
            const pt = getMousePosition(evt);

            if (currentMode === 'template' && selectedElement.classList.contains('svg-table')) {
                // Déplacer toute la sélection
                selectedElements.forEach(el => {
                    const newX = pt.x - parseFloat(el.dataset.dragOffsetX);
                    const newY = pt.y - parseFloat(el.dataset.dragOffsetY);
                    const r = el.dataset.rotation || 0;
                    const w = parseFloat(el.querySelector('rect').getAttribute('width'));
                    const h = parseFloat(el.querySelector('rect').getAttribute('height'));
                    el.setAttribute('transform', `translate(${newX}, ${newY}) rotate(${r}, ${w/2}, ${h/2})`);
                });
            } else {
                // Déplacement simple (élève)
                const newX = pt.x - offset.x;
                const newY = pt.y - offset.y;
                selectedElement.setAttribute('transform', `translate(${newX}, ${newY})`);
            }
        }
    });

    roomSvg.addEventListener('mouseup', () => {
        // Gestion du clic simple sur une sélection multiple (pour ne garder que l'élément cliqué)
        if (!isDragging && selectedElement && currentMode === 'template' && !event.ctrlKey && !event.metaKey) {
            if (selectedElements.includes(selectedElement) && selectedElements.length > 1) {
                clearSelection();
                addToSelection(selectedElement);
            }
        }
        selectedElement = null;
        isDragging = false;
    });

    roomSvg.addEventListener('mouseleave', () => {
        selectedElement = null;
        isDragging = false;
    });

    // Clic dans le vide pour désélectionner
    roomSvg.addEventListener('click', (e) => {
        if (e.target === roomSvg || e.target.tagName === 'rect' && e.target.parentNode === roomSvg) { // Clic sur le fond
            clearSelection();
        }
    });

    function getMousePosition(evt) {
        const CTM = roomSvg.getScreenCTM();
        const pt = roomSvg.createSVGPoint();
        pt.x = evt.clientX;
        pt.y = evt.clientY;
        return pt.matrixTransform(CTM.inverse());
    }

    // --- Gestion des Templates et Onglets ---

    btnTabClasses.addEventListener('click', () => switchMode('classes'));
    btnTabTemplate.addEventListener('click', () => switchMode('template'));
    btnTabData.addEventListener('click', () => switchMode('data'));

    function switchMode(mode) {
        // Sauvegarder la classe actuelle avant de changer si on était en mode classes
        if (currentMode === 'classes' && currentClass) {
            saveCurrentClass();
        }

        currentMode = mode;
        
        // Reset UI
        btnTabClasses.classList.remove('active');
        btnTabTemplate.classList.remove('active');
        btnTabData.classList.remove('active');
        controlsClasses.classList.add('hidden');
        controlsTemplate.classList.add('hidden');
        controlsData.classList.add('hidden');
        studentList.classList.add('hidden');

        if (mode === 'classes') {
            btnTabClasses.classList.add('active');
            controlsClasses.classList.remove('hidden');
            studentList.classList.remove('hidden');
            // Charger le template sélectionné pour le placement
            if (currentClass) loadClass(currentClass);
            else updateTitle();

            // Rafraîchir la disposition des groupes (correction bug affichage)
            setTimeout(() => {
                roomSvg.querySelectorAll('.svg-group').forEach(g => layoutGroupStudents(g));
            }, 50);
        } else if (mode === 'template') {
            btnTabTemplate.classList.add('active');
            controlsTemplate.classList.remove('hidden');
            // Charger le template sélectionné pour l'édition
            loadTemplate(templateSelect.value, true);
        } else if (mode === 'data') {
            btnTabData.classList.add('active');
            controlsData.classList.remove('hidden');
        }
        updateTitle();
    }

    function updateTitle() {
        let title = "Plan";
        if (currentMode === 'classes' && currentClass) {
            const tmpl = classes[currentClass].template || "Sans modèle";
            title = `${tmpl} - ${currentClass}`;
        } else if (currentMode === 'template') {
            const tmpl = templateSelectEdit.value || "Nouveau Modèle";
            title = tmpl;
        }
        roomTitle.textContent = title;
    }

    function updateTemplateSelect() {
        const options = '<option value="">-- Vide --</option>' + 
            Object.keys(templates).map(name => `<option value="${name}">${name}</option>`).join('');
        
        templateSelect.innerHTML = options;
        templateSelectEdit.innerHTML = options;
    }

    // Gestion du chargement de modèle pour édition
    templateSelectEdit.addEventListener('change', (e) => {
        if (e.target.value) {
            loadTemplate(e.target.value, true);
            newTemplateName.value = e.target.value;
        } else {
            clearRoomElements();
            newTemplateName.value = '';
        }
        updateTitle();
    });

    btnAddTable.addEventListener('click', () => {
        createSvgObject({type: 'rect', x: 500, y: 500, w: 1400, h: 700, color: '#c3aa64'}, true);
    });
    
    btnAddRoundTable.addEventListener('click', () => {
        createSvgObject({type: 'circle', x: 500, y: 500, w: 1000, h: 1000, color: '#c3aa64'}, true);
    });

    btnAddComputer.addEventListener('click', () => {
        createSvgObject({type: 'computer', x: 500, y: 500, w: 800, h: 800, color: '#323232'}, true);
    });

    btnAddSeparator.addEventListener('click', () => {
        createSvgObject({type: 'separator', x: 500, y: 500, w: 2000, h: 100, color: '#323232'}, true);
    });

    // --- Gestion des propriétés de la table (Taille / Rotation) ---

    function clearSelection() {
        selectedElements.forEach(el => el.classList.remove('selected'));
        selectedElements = [];
        selectedTable = null;
        document.querySelectorAll('.svg-student.selected').forEach(el => el.classList.remove('selected'));
    }

    function addToSelection(element) {
        if (!selectedElements.includes(element)) {
            selectedElements.push(element);
            element.classList.add('selected');
        }
        selectTable(element);
    }

    function toggleSelection(element) {
        if (selectedElements.includes(element)) {
            element.classList.remove('selected');
            selectedElements = selectedElements.filter(el => el !== element);
            if (selectedTable === element) {
                selectedTable = selectedElements.length > 0 ? selectedElements[selectedElements.length - 1] : null;
                if (selectedTable) selectTable(selectedTable);
            }
        } else {
            addToSelection(element);
        }
    }

    function selectTable(group) {
        selectedTable = group;

        // Mettre à jour les inputs avec les valeurs de la table
        const rect = group.querySelector('rect');
        tableWidthInput.value = rect.getAttribute('width');
        tableHeightInput.value = rect.getAttribute('height');
        itemColorInput.value = group.dataset.color || '#95a5a6';
        metaKeyInput.value = group.dataset.metaKey || '';
        metaValueInput.value = group.dataset.metaValue || '';
        metaDisplayInput.checked = group.dataset.metaDisplay === 'true';
        metaModeSelect.value = group.dataset.metaMode || 'always';
    }

    function updateSelectedTable() {
        if (!selectedTable) return;
        const w = parseFloat(tableWidthInput.value);
        const h = parseFloat(tableHeightInput.value);
        const rect = selectedTable.querySelector('rect');
        rect.setAttribute('width', w);
        rect.setAttribute('height', h);
        if (selectedTable.dataset.type === 'computer') {
            const svgIcon = selectedTable.querySelector('svg');
            if (svgIcon) {
                svgIcon.setAttribute('width', w);
                svgIcon.setAttribute('height', h);
            }
        }
        
        // Rafraichir le transform pour ajuster le centre de rotation
        const transform = selectedTable.transform.baseVal.getItem(0); // Translate
        const x = transform.matrix.e;
        const y = transform.matrix.f;
        const r = selectedTable.dataset.rotation || 0;
        selectedTable.setAttribute('transform', `translate(${x}, ${y}) rotate(${r}, ${w/2}, ${h/2})`);
        updateObjectMetadata(selectedTable);
    }

    tableWidthInput.addEventListener('change', updateSelectedTable);
    tableHeightInput.addEventListener('change', updateSelectedTable);

    itemColorInput.addEventListener('input', (e) => {
        if (selectedTable) {
            selectedTable.dataset.color = e.target.value;
            selectedTable.querySelector('rect').style.fill = e.target.value;
        }
    });

    // Listeners pour les métadonnées
    function updateMetaFromInput() {
        if (selectedTable) {
            selectedTable.dataset.metaKey = metaKeyInput.value;
            selectedTable.dataset.metaValue = metaValueInput.value;
            selectedTable.dataset.metaDisplay = metaDisplayInput.checked;
            selectedTable.dataset.metaMode = metaModeSelect.value;
            updateObjectMetadata(selectedTable);
        }
    }

    metaKeyInput.addEventListener('input', updateMetaFromInput);
    metaValueInput.addEventListener('input', updateMetaFromInput);
    metaDisplayInput.addEventListener('change', updateMetaFromInput);
    metaModeSelect.addEventListener('change', updateMetaFromInput);

    function updateObjectMetadata(group) {
        let text = group.querySelector('.meta-text');
        const display = group.dataset.metaDisplay === 'true';
        const value = group.dataset.metaValue;
        
        if (!display || !value) {
            if (text) text.remove();
            return;
        }

        if (!text) {
            text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.classList.add('meta-text');
            group.appendChild(text);
        }

        text.textContent = value;
        
        // Position center
        const rect = group.querySelector('rect');
        const w = parseFloat(rect.getAttribute('width'));
        const h = parseFloat(rect.getAttribute('height'));
        text.setAttribute('x', w / 2);
        text.setAttribute('y', h / 2);

        // Contre-rotation pour garder le texte horizontal
        const r = group.dataset.rotation || 0;
        text.setAttribute('transform', `rotate(-${r}, ${w/2}, ${h/2})`);

        // Mode
        const mode = group.dataset.metaMode || 'always';
        text.classList.remove('mode-always', 'mode-hover');
        text.classList.add(`mode-${mode}`);
    }

    btnRotateTable.addEventListener('click', () => {
        if (!selectedTable) return;
        let currentRotation = parseInt(selectedTable.dataset.rotation || 0);
        currentRotation = (currentRotation + 45) % 360;
        selectedTable.dataset.rotation = currentRotation;
        updateSelectedTable();
    });

    btnClearTemplate.addEventListener('click', () => {
        clearRoomElements();
        selectedTable = null;
    });

    btnSaveTemplate.addEventListener('click', () => {
        const name = newTemplateName.value.trim();
        if (!name) return alert('Veuillez donner un nom au modèle.');
        
        const tables = [];
        roomSvg.querySelectorAll('.svg-table').forEach(el => {
            const transform = el.transform.baseVal.getItem(0);
            const rect = el.querySelector('rect');
            tables.push({
                x: transform.matrix.e,
                y: transform.matrix.f,
                w: rect.getAttribute('width'),
                h: rect.getAttribute('height'),
                r: el.dataset.rotation || 0,
                type: el.dataset.type || 'rect',
                color: el.dataset.color || '#95a5a6',
                metaKey: el.dataset.metaKey || '',
                metaValue: el.dataset.metaValue || '',
                metaDisplay: el.dataset.metaDisplay === 'true',
                metaMode: el.dataset.metaMode || 'always'
            });
        });

        // Sauvegarde de la configuration complète (Objets + Salle)
        templates[name] = {
            objects: tables,
            roomWidth: roomWidthInput.value,
            roomHeight: roomHeightInput.value,
            floorColor: floorColorInput.value
        };
        localStorage.setItem('classroomTemplates', JSON.stringify(templates));
        updateTemplateSelect();
        templateSelect.value = name;
        alert('Modèle sauvegardé !');
    });

    btnDeleteTemplate.addEventListener('click', () => {
        const name = templateSelectEdit.value;
        if (!name) return alert("Veuillez sélectionner un modèle à supprimer.");
        
        if (confirm(`Voulez-vous vraiment supprimer le modèle "${name}" ?`)) {
            delete templates[name];
            localStorage.setItem('classroomTemplates', JSON.stringify(templates));
            updateTemplateSelect();
            clearRoomElements();
            newTemplateName.value = '';
        }
    });

    templateSelect.addEventListener('change', (e) => {
        const name = e.target.value;
        // Si on est en mode classe, on applique aussi la config de la salle du template
        if (currentMode === 'classes' && name && templates[name]) {
            const data = templates[name];
            roomWidthInput.value = data.roomWidth || 7000;
            roomHeightInput.value = data.roomHeight || 8000;
            floorColorInput.value = data.floorColor || '#f5e6aa';
            roomSvg.style.backgroundColor = floorColorInput.value;
            updateRoomSize();
        }
        loadTemplate(name, currentMode === 'template'); 
    });

    function clearRoomElements() {
        // Supprime tous les groupes (élèves et tables) mais garde la grille (defs/rect)
        roomSvg.querySelectorAll('g').forEach(g => g.remove());
        selectedElements = [];
    }

    function createSvgObject(data, isEditable) {
        const { type = 'rect', x, y, w, h, r = 0, color = '#95a5a6', metaKey = '', metaValue = '', metaDisplay = false, metaMode = 'always' } = data;

        const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        group.setAttribute('class', 'svg-table' + (isEditable ? ' template-mode' : ''));
        if (type === 'computer') group.classList.add('svg-computer');
        
        group.dataset.rotation = r;
        group.dataset.type = type;
        group.dataset.color = color;
        group.dataset.metaKey = metaKey;
        group.dataset.metaValue = metaValue;
        group.dataset.metaDisplay = metaDisplay;
        group.dataset.metaMode = metaMode;

        // Appliquer la transformation avec rotation autour du centre
        group.setAttribute('transform', `translate(${x}, ${y}) rotate(${r}, ${w/2}, ${h/2})`);

        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute('width', w);
        rect.setAttribute('height', h);
        
        if (type === 'circle') {
            rect.setAttribute('rx', '50%');
            rect.setAttribute('ry', '50%');
        } else {
            rect.setAttribute('rx', '10');
            rect.setAttribute('ry', '10');
        }
        
        rect.style.fill = color;

        if (type === 'computer') {
            rect.style.fill = 'transparent';
            rect.style.stroke = 'none';
        }

        group.appendChild(rect);

        if (type === 'computer') {
            const computerIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            computerIcon.setAttribute('viewBox', '0 0 1772 1772');
            computerIcon.setAttribute('width', w);
            computerIcon.setAttribute('height', h);
            computerIcon.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            computerIcon.innerHTML = `<g transform="matrix(2.77095,0,0,2.77095,-1849.61,-2054.66)">
                <g transform="matrix(0.830405,0,0,0.419525,162.825,900.336)">
                    <rect x="680" y="754" width="560.157" height="379" style="fill:rgb(124,124,124);"/>
                </g>
                <g transform="matrix(0.830405,0,0,0.419525,162.825,900.336)">
                    <path d="M1246.43,754C1246.43,747.143 1243.62,741.585 1240.16,741.585L680,741.585C676.536,741.585 673.728,747.143 673.728,754L673.728,1133C673.728,1139.86 676.536,1145.41 680,1145.41L1240.16,1145.41C1243.62,1145.41 1246.43,1139.86 1246.43,1133L1246.43,754ZM1233.88,766.415L1233.88,1120.59C1233.88,1120.59 747.347,1120.59 686.272,1120.59C686.272,1120.59 686.272,766.415 686.272,766.415L1233.88,766.415Z" style="fill:rgb(43,43,43);"/>
                </g>
                <path d="M941.711,1143.23L821.01,1143.23C816.313,1143.23 812.5,1147.04 812.5,1151.74L812.5,1171.72C812.5,1176.42 816.313,1180.23 821.01,1180.23L1099.15,1180.23C1103.84,1180.23 1107.66,1176.42 1107.66,1171.72L1107.66,1151.74C1107.66,1147.04 1103.84,1143.23 1099.15,1143.23L978.447,1143.23C978.585,1142.62 978.657,1141.99 978.657,1141.34L978.657,1098.55C978.657,1093.83 974.828,1090 970.111,1090L950.046,1090C945.329,1090 941.5,1093.83 941.5,1098.55L941.5,1141.34C941.5,1141.99 941.573,1142.62 941.711,1143.23Z" style="fill:rgb(87,87,87);"/>
                <g transform="matrix(1,0,0,1,57.1575,28.8289)">
                    <path d="M1240.16,1245.24C1240.16,1229.46 1227.35,1216.66 1211.58,1216.66C1195.81,1216.66 1183,1229.46 1183,1245.24L1183,1289.42C1183,1305.19 1195.81,1318 1211.58,1318C1227.35,1318 1240.16,1305.19 1240.16,1289.42L1240.16,1245.24Z" style="fill:rgb(124,124,124);"/>
                </g>
                <g transform="matrix(1,0,0,1,57.1575,28.8289)">
                    <path d="M1246.71,1245.24C1246.71,1225.85 1230.97,1210.11 1211.58,1210.11C1192.19,1210.11 1176.45,1225.85 1176.45,1245.24L1176.45,1289.42C1176.45,1308.81 1192.19,1324.55 1211.58,1324.55C1230.97,1324.55 1246.71,1308.81 1246.71,1289.42L1246.71,1245.24ZM1233.61,1245.24L1233.61,1289.42C1233.61,1301.58 1223.74,1311.45 1211.58,1311.45C1199.42,1311.45 1189.55,1301.58 1189.55,1289.42C1189.55,1289.42 1189.55,1245.24 1189.55,1245.24C1189.55,1233.08 1199.42,1223.21 1211.58,1223.21C1223.74,1223.21 1233.61,1233.08 1233.61,1245.24Z"/>
                </g>
                <g transform="matrix(1,0,0,0.886544,0,85.5462)">
                    <path d="M1240.16,788.11C1240.16,769.284 1226.61,754 1209.92,754L710.24,754C693.55,754 680,769.284 680,788.11L680,1098.89C680,1117.72 693.55,1133 710.24,1133L1209.92,1133C1226.61,1133 1240.16,1117.72 1240.16,1098.89L1240.16,788.11Z" style="fill:rgb(211,221,254);"/>
                </g>
                <g transform="matrix(1,0,0,0.886544,0,85.5462)">
                    <path d="M1252.66,788.11C1252.66,761.502 1233.51,739.9 1209.92,739.9C1209.92,739.9 710.24,739.9 710.24,739.9C686.651,739.9 667.5,761.502 667.5,788.11C667.5,788.11 667.5,1098.89 667.5,1098.89C667.5,1125.5 686.651,1147.1 710.24,1147.1L1209.92,1147.1C1233.51,1147.1 1252.66,1125.5 1252.66,1098.89C1252.66,1098.89 1252.66,788.11 1252.66,788.11ZM1227.66,788.11L1227.66,1098.89C1227.66,1109.93 1219.71,1118.9 1209.92,1118.9C1209.92,1118.9 710.24,1118.9 710.24,1118.9C700.449,1118.9 692.5,1109.93 692.5,1098.89L692.5,788.11C692.5,777.066 700.449,768.1 710.24,768.1L1209.92,768.1C1219.71,768.1 1227.66,777.066 1227.66,788.11Z" style="fill:rgb(59,59,59);"/>
                </g>
            </g>`;
            group.appendChild(computerIcon);
        }

        roomSvg.appendChild(group);

        // Initialiser l'affichage des métadonnées (visible aussi en mode Classe)
        updateObjectMetadata(group);

        if (isEditable) {
            attachDragEvents(group);
            // Double clic pour supprimer une table en mode édition
            group.addEventListener('dblclick', () => {
                group.remove();
            });
        }
    }

    function loadTemplate(name, isEditable) {
        clearRoomElements();
        const data = templates[name];
        
        if (data) {
            let objects = [];
            
            // Gestion rétro-compatibilité (si c'était juste un tableau d'objets)
            if (Array.isArray(data)) {
                objects = data;
            } else {
                objects = data.objects || [];
                // Si on est en mode édition de template, on charge aussi la config de la salle
                if (isEditable) {
                    roomWidthInput.value = data.roomWidth || 7000;
                    roomHeightInput.value = data.roomHeight || 8000;
                    floorColorInput.value = data.floorColor || '#f5e6aa';
                    roomSvg.style.backgroundColor = floorColorInput.value;
                    updateRoomSize();
                }
            }

            objects.forEach(t => createSvgObject(t, isEditable));
            updateTitle();
        }
    }

    // --- Gestion du Zoom ---

    function updateZoom() {
        zoomLevelDisplay.textContent = Math.round(zoomLevel * 100) + '%';
        updateRoomSize();
    }

    btnZoomIn.addEventListener('click', () => {
        zoomLevel = Math.min(zoomLevel + 0.1, 3.0);
        updateZoom();
    });

    btnZoomOut.addEventListener('click', () => {
        zoomLevel = Math.max(zoomLevel - 0.1, 0.2);
        updateZoom();
    });

    // --- Outil Pan (Déplacement de la vue) ---

    btnPanTool.addEventListener('click', () => {
        currentTool = currentTool === 'pan' ? 'select' : 'pan';
        btnPanTool.classList.toggle('active', currentTool === 'pan');
        roomContainer.style.cursor = currentTool === 'pan' ? 'grab' : 'default';
        // Désélectionner tout si on passe en mode pan
        if (currentTool === 'pan') {
            selectedElement = null;
            clearSelection();
        }
    });

    roomContainer.addEventListener('mousedown', (e) => {
        if (currentTool === 'pan') {
            isPanning = true;
            roomContainer.style.cursor = 'grabbing';
            panStart = { x: e.clientX, y: e.clientY };
            scrollStart = { x: roomContainer.scrollLeft, y: roomContainer.scrollTop };
            e.preventDefault();
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isPanning && currentTool === 'pan') {
            const dx = e.clientX - panStart.x;
            const dy = e.clientY - panStart.y;
            roomContainer.scrollLeft = scrollStart.x - dx;
            roomContainer.scrollTop = scrollStart.y - dy;
        }
    });

    // --- Toggle Info Panel & Title ---
    if (btnToggleInfo) {
        btnToggleInfo.addEventListener('click', () => {
            const infoPanel = document.getElementById('infoPanel');
            const isHidden = infoPanel.classList.toggle('hidden');
            roomTitle.classList.toggle('hidden', isHidden);
            btnToggleInfo.classList.toggle('active', !isHidden);
        });
    }

    if (btnToggleAllGroups) {
        btnToggleAllGroups.addEventListener('click', () => {
            const isHidden = roomSvg.classList.toggle('hide-all-groups');
            const isActive = !isHidden;
            btnToggleAllGroups.classList.toggle('active', isActive);

            // Répercuter sur les étiquettes de groupes
            roomSvg.classList.toggle('hide-groups', !isActive);
            if (btnToggleGroups) btnToggleGroups.classList.toggle('active', isActive);

            // Répercuter sur les élèves (Global)
            roomSvg.classList.toggle('hide-students', !isActive);
            if (btnToggleStudents) btnToggleStudents.classList.toggle('active', isActive);

            // Répercuter sur les icônes
            roomSvg.classList.toggle('hide-icons', !isActive);
            if (btnToggleIcons) btnToggleIcons.classList.toggle('active', isActive);

            // Répercuter sur les noms
            roomSvg.classList.toggle('hide-names', !isActive);
            if (btnToggleNames) btnToggleNames.classList.toggle('active', isActive);
        });
    }

    if (btnToggleGroups) {
        btnToggleGroups.addEventListener('click', () => {
            const isHidden = roomSvg.classList.toggle('hide-groups');
            btnToggleGroups.classList.toggle('active', !isHidden);
        });
    }

    if (btnToggleStudents) {
        btnToggleStudents.addEventListener('click', () => {
            // Bascule l'état actif du bouton principal
            const isActive = btnToggleStudents.classList.contains('active');
            const newState = !isActive;
            btnToggleStudents.classList.toggle('active', newState);

            // Synchronise les Icônes
            roomSvg.classList.toggle('hide-icons', !newState);
            btnToggleIcons.classList.toggle('active', newState);

            // Synchronise les Noms
            roomSvg.classList.toggle('hide-names', !newState);
            btnToggleNames.classList.toggle('active', newState);
        });
    }

    if (btnToggleIcons) {
        btnToggleIcons.addEventListener('click', () => {
            const isHidden = roomSvg.classList.toggle('hide-icons');
            btnToggleIcons.classList.toggle('active', !isHidden);
        });
    }

    if (btnToggleNames) {
        btnToggleNames.addEventListener('click', () => {
            const isHidden = roomSvg.classList.toggle('hide-names');
            btnToggleNames.classList.toggle('active', !isHidden);
        });
    }

    window.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            if (currentTool === 'pan') roomContainer.style.cursor = 'grab';
        }
    });

    // Initialisation vue
    updateRoomSize();

    // --- Gestion des Classes ---

    function updateClassSelect() {
        classSelect.innerHTML = '';
        const classNames = Object.keys(classes);
        classNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            classSelect.appendChild(option);
        });
        
        if (classNames.length > 0) {
            if (!currentClass || !classes[currentClass]) {
                currentClass = classNames[0];
            }
            classSelect.value = currentClass;
            loadClass(currentClass);
        } else {
            currentClass = null;
            clearRoomElements();
            studentsContainer.innerHTML = '';
        }
    }

    btnAddClass.addEventListener('click', () => {
        const name = prompt("Nom de la nouvelle classe (ex: 5A) :");
        if (name && !classes[name]) {
            classes[name] = {
                students: [],
                template: '',
                roomWidth: 8000,
                roomHeight: 6000
            };
            localStorage.setItem('classroomClasses', JSON.stringify(classes));
            currentClass = name;
            updateClassSelect();
        } else if (classes[name]) {
            alert("Cette classe existe déjà.");
        }
    });

    btnDeleteClass.addEventListener('click', () => {
        if (currentClass && confirm(`Supprimer la classe ${currentClass} ?`)) {
            delete classes[currentClass];
            localStorage.setItem('classroomClasses', JSON.stringify(classes));
            currentClass = null;
            updateClassSelect();
        }
    });

    classSelect.addEventListener('change', (e) => {
        if (currentClass) saveCurrentClass();
        currentClass = e.target.value;
        loadClass(currentClass);
        updateTitle();
    });

    window.addEventListener('beforeunload', () => {
        if (currentMode === 'classes' && currentClass) {
            saveCurrentClass();
        }
    });

    function saveCurrentClass() {
        if (!currentClass) return;

        const groupsList = [];
        const studentsList = [];
        const placedIds = new Set();

        // Sauvegarder les groupes
        roomSvg.querySelectorAll('.svg-group').forEach(g => {
            const transform = g.transform.baseVal.getItem(0);
            const bg = g.querySelector('.group-bg');
            let w = 0, h = 0;

            if (bg) {
                if (bg.tagName === 'circle') {
                    const r = parseFloat(bg.getAttribute('r'));
                    w = r * 2;
                    h = r * 2;
                } else {
                    w = parseFloat(bg.getAttribute('width'));
                    h = parseFloat(bg.getAttribute('height'));
                }
            }

            groupsList.push({
                id: g.dataset.groupId,
                x: transform.matrix.e,
                y: transform.matrix.f,
                w: w,
                h: h,
                shape: g.dataset.shape || 'rect',
                metaValue: g.dataset.groupName // Nom du groupe
            });
        });

        // 1. Élèves placés (Prioritaires)
        roomSvg.querySelectorAll('.svg-student').forEach(el => {
            placedIds.add(el.dataset.id);
            const transform = el.transform.baseVal.getItem(0);
            const parent = el.parentNode;
            const isInGroup = parent.classList.contains('svg-group');
            
            studentsList.push({
                id: el.dataset.id,
                nom: el.dataset.nom,
                prenom: el.dataset.prenom,
                groupe: el.dataset.groupe || "",
                status: 'placed',
                x: transform.matrix.e + 400,
                y: transform.matrix.f + 200,
                parentGroupId: isInGroup ? parent.dataset.groupId : null
            });
        });

        // 2. Élèves dans la sidebar (Seulement ceux qui ne sont PAS placés)
        document.querySelectorAll('.student-item').forEach(el => {
            if (!placedIds.has(el.dataset.id)) {
                studentsList.push({
                    id: el.dataset.id,
                    nom: el.dataset.nom,
                    prenom: el.dataset.prenom,
                    groupe: el.dataset.groupe || "",
                    status: 'sidebar'
                });
            }
        });

        classes[currentClass] = {
            groups: groupsList,
            students: studentsList,
            template: templateSelect.value,
            roomWidth: roomWidthInput.value,
            roomHeight: roomHeightInput.value
        };
        localStorage.setItem('classroomClasses', JSON.stringify(classes));
    }

    function loadClass(name) {
        const data = classes[name];
        if (!data) return;

        const templateName = data.template;

        // Si un modèle est utilisé, on charge sa configuration de salle (taille, couleur)
        if (templateName && templates[templateName]) {
            const tmpl = templates[templateName];
            roomWidthInput.value = tmpl.roomWidth || 7000;
            roomHeightInput.value = tmpl.roomHeight || 8000;
            floorColorInput.value = tmpl.floorColor || '#f5e6aa';
        } else {
            roomWidthInput.value = data.roomWidth || 8000;
            roomHeightInput.value = data.roomHeight || 6000;
            floorColorInput.value = data.floorColor || '#ffffff';
        }

        roomSvg.style.backgroundColor = floorColorInput.value;
        updateRoomSize();
        templateSelect.value = templateName || '';
        
        // Charger Template
        loadTemplate(templateName, false);

        // Charger Élèves
        studentsContainer.innerHTML = '';
        
        // Charger les Groupes placés
        const groupElements = {};
        if (data.groups) {
            data.groups.forEach(g => {
                // On crée le groupe vide, les élèves seront ajoutés après
                createSvgGroup(g.metaValue, [], g.x, g.y, g, g.shape);
                // On récupère le dernier élément ajouté qui est notre groupe
                const groupEl = roomSvg.lastElementChild;
                groupElements[g.id] = groupEl;
            });
        }

        // Regrouper les élèves de la sidebar pour l'affichage
        const sidebarStudentsByGroup = {};

        // Initialiser avec les groupes placés pour qu'ils apparaissent dans la sidebar
        if (data.groups) {
            data.groups.forEach(g => {
                if (!sidebarStudentsByGroup[g.metaValue]) sidebarStudentsByGroup[g.metaValue] = [];
            });
        }
        
        if (data.students) {
            data.students.forEach(s => {
                // Toujours ajouter à la liste latérale (sidebar)
                const g = s.groupe || "Sans Groupe";
                if (!sidebarStudentsByGroup[g]) sidebarStudentsByGroup[g] = [];
                sidebarStudentsByGroup[g].push(s);

                // Si placé, ajouter AUSSI sur le plan
                if (s.status === 'placed') {
                    const container = s.parentGroupId ? groupElements[s.parentGroupId] : roomSvg;
                    if (container) {
                        createSvgStudent(s.nom, s.prenom, s.x, s.y, s.id, s.groupe, container);
                    }
                }
            });

            // Afficher les groupes dans la sidebar
            for (const [groupName, students] of Object.entries(sidebarStudentsByGroup)) {
                const { block, listContainer } = createGroupBlock(groupName);
                studentsContainer.appendChild(block);
                students.forEach(s => {
                    const item = createSidebarStudent(s.nom, s.prenom, s.id, s.groupe);
                    listContainer.appendChild(item);
                });
            }

            // Rafraîchir la disposition de tous les groupes pour corriger le fond
            roomSvg.querySelectorAll('.svg-group').forEach(g => layoutGroupStudents(g));

            updateTitle();
        }
    }

    // --- Export / Import de Données (JSON) ---

    btnExportData.addEventListener('click', () => {
        if (currentMode === 'classes' && currentClass) saveCurrentClass();
        
        const globalData = {
            version: 1,
            templates: templates,
            classes: classes
        };
        
        const dataStr = JSON.stringify(globalData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = "modeles_classe.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Gestion du Drag & Drop sur la zone d'import
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);

                if (data.version && data.classes && data.templates) {
                    // Import Global (Classes + Templates)
                    classes = data.classes;
                    templates = data.templates;
                    localStorage.setItem('classroomClasses', JSON.stringify(classes));
                    localStorage.setItem('classroomTemplates', JSON.stringify(templates));
                    updateClassSelect();
                    updateTemplateSelect();
                    alert('Données complètes importées avec succès !');
                } else {
                    // Import ancien format (Templates uniquement)
                    templates = { ...templates, ...data };
                    localStorage.setItem('classroomTemplates', JSON.stringify(templates));
                    updateTemplateSelect();
                    alert('Modèles importés avec succès !');
                }
            } catch (err) {
                alert('Erreur lors de la lecture du fichier JSON.');
                console.error(err);
            }
        };
        reader.readAsText(file);
    });

    // --- Fonctions Reset et Démo ---

    if (btnResetAll) {
        btnResetAll.addEventListener('click', () => {
            if (confirm("ATTENTION : Vous allez effacer TOUTES les données (Modèles et Classes). Cette action est irréversible.\n\nVoulez-vous continuer ?")) {
                localStorage.clear();
                location.reload();
            }
        });
    }

    if (btnLoadDemo) {
        btnLoadDemo.addEventListener('click', () => {
            createDemoData();
        });
    }

    function createDemoData() {
        const demoTemplateName = "Salle Standard (Démo)";

        // 1. Créer ou mettre à jour le modèle de salle (8 Ilots pour 30 élèves)
        templates[demoTemplateName] = {
            roomWidth: 8000,
            roomHeight: 7000,
            floorColor: "#f5e6aa",
            objects: [
                { type: 'rect', x: 3500, y: 500, w: 1600, h: 800, r: 0, color: '#e67e22', metaValue: "Bureau Prof", metaDisplay: true },
                { type: 'rect', x: 1000, y: 2000, w: 1400, h: 700, r: 0, color: '#c3aa64', metaValue: "Ilot 1", metaDisplay: true },
                { type: 'rect', x: 3500, y: 2000, w: 1400, h: 700, r: 0, color: '#c3aa64', metaValue: "Ilot 2", metaDisplay: true },
                { type: 'rect', x: 6000, y: 2000, w: 1400, h: 700, r: 0, color: '#c3aa64', metaValue: "Ilot 3", metaDisplay: true },
                { type: 'rect', x: 1000, y: 4000, w: 1400, h: 700, r: 0, color: '#c3aa64', metaValue: "Ilot 4", metaDisplay: true },
                { type: 'rect', x: 3500, y: 4000, w: 1400, h: 700, r: 0, color: '#c3aa64', metaValue: "Ilot 5", metaDisplay: true },
                { type: 'rect', x: 6000, y: 4000, w: 1400, h: 700, r: 0, color: '#c3aa64', metaValue: "Ilot 6", metaDisplay: true },
                { type: 'rect', x: 1000, y: 5500, w: 1400, h: 700, r: 0, color: '#c3aa64', metaValue: "Ilot 7", metaDisplay: true },
                { type: 'rect', x: 3500, y: 5500, w: 1400, h: 700, r: 0, color: '#c3aa64', metaValue: "Ilot 8", metaDisplay: true }
            ]
        };

        // 2. Créer le modèle Salle Info (Ordinateurs sur le contour)
        const demoInfoTemplateName = "Salle Info (Démo)";
        templates[demoInfoTemplateName] = {
            roomWidth: 9000,
            roomHeight: 7000,
            floorColor: "#d4e6f1",
            objects: [
                { type: 'rect', x: 3700, y: 200, w: 1600, h: 800, r: 0, color: '#e67e22', metaValue: "Bureau Prof", metaDisplay: true },
                // Mur Gauche (5 Ordis)
                { type: 'computer', x: 200, y: 1500, w: 800, h: 800, r: 90, color: '#333' },
                { type: 'computer', x: 200, y: 2400, w: 800, h: 800, r: 90, color: '#333' },
                { type: 'computer', x: 200, y: 3300, w: 800, h: 800, r: 90, color: '#333' },
                { type: 'computer', x: 200, y: 4200, w: 800, h: 800, r: 90, color: '#333' },
                { type: 'computer', x: 200, y: 5100, w: 800, h: 800, r: 90, color: '#333' },
                // Mur Droit (5 Ordis)
                { type: 'computer', x: 8000, y: 1500, w: 800, h: 800, r: -90, color: '#333' },
                { type: 'computer', x: 8000, y: 2400, w: 800, h: 800, r: -90, color: '#333' },
                { type: 'computer', x: 8000, y: 3300, w: 800, h: 800, r: -90, color: '#333' },
                { type: 'computer', x: 8000, y: 4200, w: 800, h: 800, r: -90, color: '#333' },
                { type: 'computer', x: 8000, y: 5100, w: 800, h: 800, r: -90, color: '#333' },
                // Fond (7 Ordis)
                { type: 'computer', x: 1400, y: 6000, w: 800, h: 800, r: 0, color: '#333' },
                { type: 'computer', x: 2300, y: 6000, w: 800, h: 800, r: 0, color: '#333' },
                { type: 'computer', x: 3200, y: 6000, w: 800, h: 800, r: 0, color: '#333' },
                { type: 'computer', x: 4100, y: 6000, w: 800, h: 800, r: 0, color: '#333' },
                { type: 'computer', x: 5000, y: 6000, w: 800, h: 800, r: 0, color: '#333' },
                { type: 'computer', x: 5900, y: 6000, w: 800, h: 800, r: 0, color: '#333' },
                { type: 'computer', x: 6800, y: 6000, w: 800, h: 800, r: 0, color: '#333' },
                // Centre
                { type: 'rect', x: 2500, y: 2500, w: 1600, h: 1600, r: 0, color: '#c3aa64', metaValue: "Centre 1", metaDisplay: true },
                { type: 'rect', x: 4900, y: 2500, w: 1600, h: 1600, r: 0, color: '#c3aa64', metaValue: "Centre 2", metaDisplay: true }
            ]
        };

        // Helper pour générer des élèves
        const createStudent = (id, nom, prenom, groupe, status, x, y, parentGroupId) => ({
            id, nom, prenom, groupe, status, x, y, parentGroupId
        });

        // Listes de noms pour la génération réaliste
        const noms = ["Dupont", "Durand", "Martin", "Bernard", "Thomas", "Petit", "Robert", "Richard", "Dubois", "Moreau", "Laurent", "Simon", "Michel", "Lefebvre", "Leroy", "Roux", "David", "Bertrand", "Morel", "Fournier", "Girard", "Bonnet", "Lambert", "Fontaine", "Rousseau", "Vincent", "Muller", "Lefevre", "Faure", "Andre", "Mercier", "Blanc", "Guerin", "Boyer", "Garnier", "Chevalier", "Francois", "Legrand", "Gauthier", "Garcia"];
        const prenoms = ["Gabriel", "Léo", "Raphaël", "Arthur", "Louis", "Emma", "Jade", "Louise", "Lucas", "Adam", "Maël", "Jules", "Hugo", "Liam", "Alice", "Chloé", "Lina", "Mila", "Rose", "Mia", "Paul", "Tiago", "Ambre", "Sacha", "Noah", "Gaspard", "Eden", "Mohamed", "Léon", "Anna", "Aaron", "Ethan", "Julia", "Romy", "Léonie", "Inès", "Nolan", "Tom", "Timéo", "Sarah"];
        
        let nameIdx = 0;
        const getNextIdentity = () => {
            const n = noms[nameIdx % noms.length];
            // Décalage pour varier les combinaisons
            const p = prenoms[(nameIdx + 7) % prenoms.length]; 
            nameIdx++;
            return { nom: n, prenom: p };
        };

        // Configuration commune des groupes (Ajustement X -500 demandé)
        const groupNames = ["Ilot 1", "Ilot 2", "Ilot 3", "Ilot 4", "Ilot 5", "Ilot 6", "Ilot 7", "Ilot 8"];
        const groupPositions = [
            {x: 400, y: 1900}, {x: 2900, y: 1900}, {x: 5400, y: 1900},
            {x: 400, y: 3900}, {x: 2900, y: 3900}, {x: 5400, y: 3900},
            {x: 400, y: 5400}, {x: 2900, y: 5400}
        ];

        // Classe 2 : 6eme A (30 élèves, Placée sur le plan)
        // Classe 2 : 6eme A (30 élèves, Groupes sur plan, Élèves dans liste)
        const class2Name = "6eme A (Démo)";
        if (!classes[class2Name]) {
            const students = [];
            const groups = [];

            let studentId = 1;
            groupNames.forEach((gName, idx) => {
                const gId = `g-6a-${idx}`;
                const pos = groupPositions[idx];
                groups.push({ id: gId, x: pos.x, y: pos.y, w: 1600, h: 900, shape: "rect", metaValue: gName });

                // 6 groupes de 4 (24) + 2 groupes de 3 (6) = 30
                const count = (idx < 6) ? 4 : 3;
                for(let i=0; i<count; i++) {
                    const ident = getNextIdentity();
                    students.push(createStudent(`d6a-${studentId}`, ident.nom, ident.prenom, gName, "placed", 0, 0, gId));
                    studentId++;
                }
            });
            
            classes[class2Name] = { template: demoTemplateName, roomWidth: 8000, roomHeight: 7000, floorColor: "#e8f8f5", students, groups };
        }

        // Classe 3 : 5eme B (30 élèves, Complète et Placée)
        // Classe 3 : 5eme B (30 élèves, Groupes sur plan, Élèves dans liste)
        const classPlacedName = "5eme B (Démo)";
        if (!classes[classPlacedName]) {
             const students = [];
             const groups = [];

            let studentId = 1;
            groupNames.forEach((gName, idx) => {
                const gId = `g-5b-${idx}`;
                const pos = groupPositions[idx];
                groups.push({ id: gId, x: pos.x, y: pos.y, w: 1600, h: 900, shape: "rect", metaValue: gName });
                
                const count = (idx < 6) ? 4 : 3;
                for(let i=0; i<count; i++) {
                    const ident = getNextIdentity();
                    students.push(createStudent(`d5b-${studentId}`, ident.nom, ident.prenom, gName, "placed", 0, 0, gId));
                    studentId++;
                }
            });
            classes[classPlacedName] = { template: demoTemplateName, roomWidth: 8000, roomHeight: 7000, floorColor: "#e8f6f3", students, groups };
        }

        // Classe 4 : 6A_salle_info (Nouvelle salle)
        const classInfoName = "6A_salle_info";
        if (!classes[classInfoName]) {
            const students = [];
            const groups = [];
            
            const infoGroups = [
                { name: "Mur Gauche", x: 600, y: 3700 },
                { name: "Mur Droit", x: 7400, y: 3200 },
                { name: "Fond", x: 3500, y: 5900 },
                { name: "Centre 1", x: 2300, y: 2800 },
                { name: "Centre 2", x: 4700, y: 2800 }
            ];

            infoGroups.forEach((g, idx) => {
                const gId = `g-info-${idx}`;
                groups.push({ id: gId, x: g.x, y: g.y, w: 1600, h: 1200, shape: "rect", metaValue: g.name });
                
                // 4 élèves par groupe (20 total)
                for(let i=0; i<4; i++) {
                     const ident = getNextIdentity();
                     students.push(createStudent(`d-info-${idx}-${i}`, ident.nom, ident.prenom, g.name, "placed", 0, 0, gId));
                }
            });

            classes[classInfoName] = { template: demoInfoTemplateName, roomWidth: 9000, roomHeight: 7000, floorColor: "#d4e6f1", students, groups };
        }

        // Sauvegarde
        localStorage.setItem('classroomTemplates', JSON.stringify(templates));
        localStorage.setItem('classroomClasses', JSON.stringify(classes));

        // Mise à jour UI
        updateTemplateSelect();
        updateClassSelect();
        
        // Charger la classe de démo principale
        classSelect.value = class2Name;
        currentClass = class2Name;
        loadClass(class2Name);
        classSelect.value = classInfoName;
        currentClass = classInfoName;
        loadClass(classInfoName);
        switchMode('classes');
        
        alert("Données de démonstration chargées (2 classes) !");
        alert("Données de démonstration chargées (3 classes dont Salle Info) !");
    }
});