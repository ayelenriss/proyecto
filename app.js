const formulario = document.getElementById('search-form');
const buscador = document.getElementById('city-input');
const botonUnidad = document.getElementById('unit-button');
const mensaje = document.getElementById('status');
const dialogo = document.getElementById('info-dialog');
const botonesDias = document.querySelectorAll('.day-card');
const botonesCiudades = document.querySelectorAll('.city-card');

let datosClima = null;
let unidad = 'C';
let diaSeleccionado = 0;
let consultaActual = 0;

function temperatura(grados) {
    if (unidad === 'C') {
        return Math.round(grados) + '°C';
    } else {
        return Math.round((grados * 9 / 5) + 32) + '°F';
    }
}

function mostrarMensaje(texto, esError) {
    mensaje.textContent = texto;
    mensaje.classList.toggle('error', esError === true);
}

function mostrarIcono(imagen, condicion) {
    imagen.src = condicion.icon;
    imagen.alt = condicion.text;
    imagen.hidden = false;
}


async function cargarCiudad(ciudad) {
    consultaActual = consultaActual + 1;
    const numeroConsulta = consultaActual;
    mostrarMensaje('Consultando el cielo…', false);
    try {
        const datos = await consultarClima(ciudad);
        if (numeroConsulta !== consultaActual) {
            return;
        }
        datosClima = datos;
        diaSeleccionado = 0;
        mostrarClima();
        mostrarMensaje('', false);
    } catch (error) {
        if (numeroConsulta === consultaActual) {
            mostrarMensaje(error.message, true);
        }
    }
}

function mostrarClima() {
    const actual = datosClima.current;
    const lugar = datosClima.location;
    const hoy = datosClima.forecast.forecastday[0].day;

    document.getElementById('current-city').textContent = lugar.name;
    document.getElementById('country').textContent = lugar.country;
    document.getElementById('current-temp').textContent = temperatura(actual.temp_c);
    document.getElementById('condition-title').textContent = actual.condition.text + '.';
    document.getElementById('weather-description').textContent = 'Así está el cielo en ' + lugar.name + '. Máxima de ' + temperatura(hoy.maxtemp_c) + ' y mínima de ' + temperatura(hoy.mintemp_c) + '. Probabilidad de lluvia: ' + hoy.daily_chance_of_rain + '%.';
    document.getElementById('feels-like').textContent = 'Sensación térmica ' + temperatura(actual.feelslike_c);
    document.getElementById('wind').textContent = actual.wind_kph + ' km/h';
    document.getElementById('humidity').textContent = actual.humidity + '%';
    document.getElementById('uv').textContent = actual.uv + ' (máx. del día)';
    document.getElementById('local-date').textContent = lugar.localtime.split(' ')[0];
    document.getElementById('local-date').dateTime = lugar.localtime.split(' ')[0];
    document.getElementById('updated').textContent = 'ACTUALIZADO: ' + actual.last_updated + ' · HORA LOCAL';
    mostrarIcono(document.getElementById('current-icon'), actual.condition);

    for (let i = 0; i < botonesDias.length; i++) {
        const pronostico = datosClima.forecast.forecastday[i];
        const boton = botonesDias[i];
        boton.hidden = !pronostico;
        if (pronostico) {
            boton.querySelector('.day-name').textContent = pronostico.date;
            if (i === 0) {
                boton.querySelector('.day-name').textContent = 'Hoy';
            }
            boton.querySelector('.day-temperature').textContent = temperatura(pronostico.day.maxtemp_c);
            boton.querySelector('.rain').textContent = pronostico.day.daily_chance_of_rain + '%';
            mostrarIcono(boton.querySelector('img'), pronostico.day.condition);
        }
    }
    mostrarDia();
}

function mostrarDia() {
    const dia = datosClima.forecast.forecastday[diaSeleccionado];
    for (let i = 0; i < botonesDias.length; i++) {
        botonesDias[i].classList.toggle('selected', i === diaSeleccionado);
        botonesDias[i].setAttribute('aria-pressed', i === diaSeleccionado);
    }
    document.getElementById('day-detail').textContent = dia.day.condition.text + '. Mínima ' + temperatura(dia.day.mintemp_c) + ' · Máxima ' + temperatura(dia.day.maxtemp_c) + ' · Amanecer ' + dia.astro.sunrise + '.';
    dibujarGrafico(dia.hour);
}

function dibujarGrafico(horas) {
    let minima = horas[0].temp_c;
    let maxima = minima;
    for (let i = 0; i < horas.length; i++) {
        minima = Math.min(minima, horas[i].temp_c);
        maxima = Math.max(maxima, horas[i].temp_c);
    }
    let linea = '';
    for (let i = 0; i < horas.length; i++) {
        const x = i * 600 / (horas.length - 1);
        const y = 85 - (horas[i].temp_c - minima + 2) / (maxima - minima + 4) * 70;
        if (i === 0) {
            linea = 'M' + x + ',' + y;
        } else {
            linea = linea + ' L' + x + ',' + y;
        }
    }
    document.getElementById('chart-line').setAttribute('d', linea);
    document.getElementById('chart-area').setAttribute('d', linea + ' L600,100 L0,100 Z');
}

async function cargarOtrasCiudades() {
    for (let i = 0; i < botonesCiudades.length; i++) {
        const boton = botonesCiudades[i];
        try {
            const datos = await consultarClima(boton.dataset.ciudad + ', Argentina');
            boton.dataset.temperatura = datos.current.temp_c;
            boton.querySelector('small').textContent = datos.current.condition.text;
            boton.querySelector('.city-temp').textContent = temperatura(datos.current.temp_c);
            mostrarIcono(boton.querySelector('img'), datos.current.condition);
        } catch (error) {
            boton.querySelector('small').textContent = 'Consultar clima ↗';
        }
    }
}

formulario.addEventListener('submit', function(evento) {
    evento.preventDefault(); 
    const ciudad = buscador.value.trim();
    if (ciudad !== '') {
        cargarCiudad(ciudad);
    }
});

botonUnidad.addEventListener('click', function() {
    if (unidad === 'C') {
        unidad = 'F';
        botonUnidad.textContent = '°F';
        botonUnidad.setAttribute('aria-label', 'Cambiar a grados Celsius');
    } else {
        unidad = 'C';
        botonUnidad.textContent = '°C';
        botonUnidad.setAttribute('aria-label', 'Cambiar a grados Fahrenheit');
    }

    if (datosClima !== null) {
        mostrarClima();
    }
    for (let i = 0; i < botonesCiudades.length; i++) {
        const boton = botonesCiudades[i];
        if (boton.dataset.temperatura !== undefined) {
            boton.querySelector('.city-temp').textContent = temperatura(Number(boton.dataset.temperatura));
        }
    }
});

for (let i = 0; i < botonesDias.length; i++) {
    botonesDias[i].addEventListener('click', function() {
        diaSeleccionado = i;
        mostrarDia();
    });
}

for (let i = 0; i < botonesCiudades.length; i++) {
    botonesCiudades[i].addEventListener('click', function() {
        const ciudad = botonesCiudades[i].dataset.ciudad + ', Argentina';
        cargarCiudad(ciudad);
    });
}

function usarUbicacion(posicion) {
    cargarCiudad(posicion.coords.latitude + ',' + posicion.coords.longitude);
}

function errorUbicacion() {
    mostrarMensaje('No pudimos acceder a tu ubicación. Buscá una ciudad.', true);
}

document.getElementById('location-button').addEventListener('click', function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(usarUbicacion, errorUbicacion, { timeout: 10000 });
    } else {
        errorUbicacion();
    }
});

document.getElementById('home-button').addEventListener('click', function() {
    buscador.focus();
});

document.getElementById('forecast-button').addEventListener('click', function() {
    document.getElementById('forecast').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('info-button').addEventListener('click', function() {
    dialogo.showModal();
});

document.getElementById('close-dialog').addEventListener('click', function() {
    dialogo.close();
});

cargarCiudad('Junin, Buenos Aires, Argentina');
cargarOtrasCiudades();