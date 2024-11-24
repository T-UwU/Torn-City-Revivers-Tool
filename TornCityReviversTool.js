// ==UserScript==
// @name         Torn City Reviver's Tool
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  A tool to make it easier to revive people while in the Hospital page: Checks if users are available for revive in Torn City while in the hospital page, displays their names with revive buttons, and updates on page change, with collapsible box feature, status filter (Active, Idle, Offline), sorting options, pagination and manual refresh. Suggestions are welcome :3
// @author       LilyWaterbug [2608747]
// @match        https://www.torn.com/hospitalview.php*
// @grant        none
// @license     MIT
// ==/UserScript==

(function() {
    'use strict';

    // Crear un cuadro colapsable para mostrar los nombres de los usuarios disponibles
    const resultBox = document.createElement('div');
    resultBox.style.position = 'fixed';
    resultBox.style.top = '10px';
    resultBox.style.right = '10px';
    resultBox.style.width = '220px';
    resultBox.style.height = 'auto';
    resultBox.style.overflowY = 'scroll';
    resultBox.style.padding = '10px';
    resultBox.style.backgroundColor = '#f4f4f4';
    resultBox.style.border = '1px solid #ccc';
    resultBox.style.zIndex = '1000';
    resultBox.style.fontSize = '14px';
    resultBox.style.borderRadius = '8px';

    // Título colapsable con contador de usuarios disponibles y menú de ordenamiento
    const title = document.createElement('div');
    title.innerHTML = '<strong>Available to revive (<span id="user-count">0</span>):</strong>';
    title.style.cursor = 'pointer';
    title.style.userSelect = 'none';
    title.addEventListener('click', () => {
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
    });
    resultBox.appendChild(title);

    // Menú de ordenamiento con estilo mejorado
    const sortMenu = document.createElement('select');
    sortMenu.innerHTML = `
        <option value="status">By Status (Active, Idle, Offline)</option>
        <option value="status-reverse">By Status (Offline, Idle, Active)</option>
        <option value="time">By Time (Longest to Shortest)</option>
        <option value="time-reverse">By Time (Shortest to Longest)</option>
    `;
    sortMenu.style.marginBottom = '10px';
    sortMenu.style.width = '100%';
    sortMenu.style.padding = '5px';
    sortMenu.style.borderRadius = '4px';
    sortMenu.style.border = '1px solid #ccc';
    sortMenu.style.backgroundColor = '#f9f9f9';
    sortMenu.addEventListener('change', updateAvailableUsers);
    resultBox.appendChild(sortMenu);

    // Controles de paginación y botón de refresco manual
    const controlsContainer = document.createElement('div');
    controlsContainer.style.display = 'flex';
    controlsContainer.style.justifyContent = 'space-between';
    controlsContainer.style.marginBottom = '10px';

    const prevPageButton = document.createElement('button');
    prevPageButton.textContent = '⬅️';
    prevPageButton.style.cursor = 'pointer';
    prevPageButton.style.padding = '5px';
    prevPageButton.style.borderRadius = '4px';
    prevPageButton.style.border = '1px solid #ccc';
    prevPageButton.style.backgroundColor = '#f9f9f9';
    prevPageButton.addEventListener('click', () => navigatePage(-1));
    controlsContainer.appendChild(prevPageButton);

    const refreshButton = document.createElement('button');
    refreshButton.textContent = '🔄 Refresh';
    refreshButton.style.cursor = 'pointer';
    refreshButton.style.padding = '5px';
    refreshButton.style.borderRadius = '4px';
    refreshButton.style.border = '1px solid #ccc';
    refreshButton.style.backgroundColor = '#f9f9f9';
    refreshButton.addEventListener('click', () => location.reload()); // Forzar recarga de página
    controlsContainer.appendChild(refreshButton);

    const nextPageButton = document.createElement('button');
    nextPageButton.textContent = '➡️';
    nextPageButton.style.cursor = 'pointer';
    nextPageButton.style.padding = '5px';
    nextPageButton.style.borderRadius = '4px';
    nextPageButton.style.border = '1px solid #ccc';
    nextPageButton.style.backgroundColor = '#f9f9f9';
    nextPageButton.addEventListener('click', () => navigatePage(1));
    controlsContainer.appendChild(nextPageButton);

    resultBox.appendChild(controlsContainer);

    // Contenido que se colapsa
    const content = document.createElement('div');
    content.style.display = 'block';
    resultBox.appendChild(content);

    document.body.appendChild(resultBox);

    function clearResultBox() {
        while (content.firstChild) {
            content.removeChild(content.firstChild);
        }
    }

    // Función para actualizar el contador de usuarios
    function updateUserCount(count) {
        document.getElementById('user-count').textContent = count;
    }

    // Función para obtener el estado del usuario
    function getUserStatus(userElement) {
        const iconTray = userElement.querySelector('#iconTray li');
        if (iconTray && iconTray.title.includes("Online")) {
            return 'Active';
        } else if (iconTray && iconTray.title.includes("Idle")) {
            return 'Idle';
        } else {
            return 'Offline';
        }
    }

    // Función para obtener el tiempo de espera del usuario
    function getUserTime(userElement) {
        const timeText = userElement.querySelector('.time')?.innerText || "0m";
        const timeParts = timeText.match(/(\d+)([hm])/);
        if (timeParts) {
            const value = parseInt(timeParts[1]);
            return timeParts[2] === 'h' ? value * 60 : value;
        }
        return 0;
    }

    // Función para agregar nombres con enlace, botón de revivir y estado al cuadro de resultados
    function addToResultBox(userId, reviveLinkElement, status) {
        const userContainer = document.createElement('div');
        userContainer.style.display = 'grid';
        userContainer.style.gridTemplateColumns = '1fr auto';
        userContainer.style.alignItems = 'center';
        userContainer.style.gap = '8px';
        userContainer.style.marginBottom = '5px';

        const link = document.createElement('a');
        link.href = `https://www.torn.com/profiles.php?XID=${userId}`;
        link.textContent = `ID: ${userId} (${status})`;
        link.target = '_blank';
        link.style.color = status === 'Active' ? '#28a745' : status === 'Idle' ? '#ffc107' : '#6c757d';
        link.style.textDecoration = 'none';

        const reviveButton = document.createElement('button');
        reviveButton.style.cursor = 'pointer';
        reviveButton.style.backgroundColor = '#FF6347';
        reviveButton.style.border = 'none';
        reviveButton.style.borderRadius = '50%';
        reviveButton.style.width = '24px';
        reviveButton.style.height = '24px';
        reviveButton.style.display = 'flex';
        reviveButton.style.alignItems = 'center';
        reviveButton.style.justifyContent = 'center';
        reviveButton.innerHTML = '<span style="color:white;font-weight:bold;">+</span>';

        reviveButton.addEventListener('click', function() {
            reviveLinkElement.querySelector('.revive-icon').click();
            setTimeout(() => {
                reviveLinkElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        });

        userContainer.appendChild(link);
        userContainer.appendChild(reviveButton);
        content.appendChild(userContainer);
    }

    // Función para navegar entre páginas de usuarios en el hospital
    let currentPage = 0;
    function navigatePage(direction) {
        currentPage += direction;
        if (currentPage < 0) currentPage = 0; // No retroceder más allá de la primera página
        window.location.href = `https://www.torn.com/hospitalview.php#start=${currentPage * 50}`;
        setTimeout(updateAvailableUsers, 500); // Delay para recargar la lista después de cambiar de página
    }

    // Función para procesar y actualizar la lista de usuarios disponibles
    function updateAvailableUsers() {
        clearResultBox();

        const userContainers = [...document.querySelectorAll('.user-info-list-wrap li')];
        let usersData = userContainers.map(user => {
            const reviveLink = user.querySelector('a.revive');
            if (reviveLink && !reviveLink.classList.contains('reviveNotAvailable')) {
                const href = reviveLink.getAttribute('href');
                const userIdMatch = href.match(/ID=(\d+)/);
                if (userIdMatch && userIdMatch[1]) {
                    return {
                        userId: userIdMatch[1],
                        reviveLinkElement: reviveLink,
                        status: getUserStatus(user),
                        time: getUserTime(user),
                    };
                }
            }
            return null;
        }).filter(user => user !== null);

        const sortBy = sortMenu.value;
        if (sortBy === 'status') {
            usersData.sort((a, b) => a.status.localeCompare(b.status));
        } else if (sortBy === 'status-reverse') {
            usersData.sort((a, b) => b.status.localeCompare(a.status));
        } else if (sortBy === 'time') {
            usersData.sort((a, b) => b.time - a.time);
        } else if (sortBy === 'time-reverse') {
            usersData.sort((a, b) => a.time - b.time);
        }

        let userCount = usersData.length;
        usersData.forEach(userData => {
            addToResultBox(userData.userId, userData.reviveLinkElement, userData.status);
        });

        updateUserCount(userCount);

        if (userCount === 0) {
            const noUserMessage = document.createElement('div');
            noUserMessage.textContent = "No users available to revive.";
            noUserMessage.style.color = 'gray';
            noUserMessage.style.textAlign = 'center';
            noUserMessage.style.fontSize = '12px';
            content.appendChild(noUserMessage);
        }
    }

    let lastUrl = window.location.href;
    new MutationObserver(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            updateAvailableUsers();
        }
    }).observe(document, { subtree: true, childList: true });

    const listObserver = new MutationObserver(updateAvailableUsers);
    const hospitalList = document.querySelector('.user-info-list-wrap');
    if (hospitalList) {
        listObserver.observe(hospitalList, { childList: true, subtree: true });
    }

    window.addEventListener('load', updateAvailableUsers);
})();
