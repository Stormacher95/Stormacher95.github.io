// ===== NÚCLEO COMPARTIDO (idéntico en Codigo.gs y en index.html) =====
var Core = (function () {
  var ACCIONES = {
    conquista: 'Conquista', toma: 'Toma de zona libre', defensa: 'Defensa',
    disputa: 'Disputa', liberacion: 'Liberación', muerto: 'Punto Muerto', resguardo: 'Resguardo'
  };
  var ESTADOS = ['Neutral', 'Controlada', 'En disputa', 'Punto Muerto'];
  // Líderes informados por la administración (se cargan solo si el team no tiene líder).
  var LIDERES = { 'Team Aqua': 'Kaivel', 'Team Rekiem': 'omarito', 'Team Plasma': 'Racso', 'Team Rocket': 'Wilfresh', 'Team Delta': 'José Luís', 'Team Magma': 'Leonardo', 'Escuadrón Élite': 'Stormacher' };
  var CUPO = 30;
  // Regiones del mapa: cada zona pertenece a una y sus coordenadas son sobre el mapa de esa región.
  var REGIONES = [{ id: 'star', nombre: 'Región Star' }, { id: 'jungla', nombre: 'La Jungla' }];
  function region(v) { v = txt(v).toLowerCase(); for (var i = 0; i < REGIONES.length; i++) if (REGIONES[i].id === v) return v; return ''; }
  function regionDe(t) { return region(t && t.region) || 'star'; }
  // Pueblos que están en La Jungla: arrancan en esa región (en planillas viejas, solo si todavía no tenían punto en el mapa).
  var EN_JUNGLA = ['Pueblo Arcturus', 'Pueblo Wezen', 'Pueblo Régulo', 'Pueblo Procyon'];
  function regionInicial(t) { return EN_JUNGLA.indexOf(txt(t.nombre)) >= 0 && (t.x === '' || t.x == null) ? 'jungla' : 'star'; }
  var TIPOS = ['Normal', 'Fuego', 'Agua', 'Planta', 'Eléctrico', 'Hielo', 'Lucha', 'Veneno', 'Tierra', 'Volador', 'Psíquico', 'Bicho', 'Roca', 'Fantasma', 'Dragón', 'Siniestro', 'Acero', 'Hada'];
  var NATURALEZAS = {
    'Fuerte': '', 'Huraña': '+Atq −Def', 'Audaz': '+Atq −Vel', 'Firme': '+Atq −AtEsp', 'Pícara': '+Atq −DefEsp',
    'Osada': '+Def −Atq', 'Dócil': '', 'Plácida': '+Def −Vel', 'Agitada': '+Def −AtEsp', 'Floja': '+Def −DefEsp',
    'Miedosa': '+Vel −Atq', 'Activa': '+Vel −Def', 'Seria': '', 'Alegre': '+Vel −AtEsp', 'Ingenua': '+Vel −DefEsp',
    'Modesta': '+AtEsp −Atq', 'Afable': '+AtEsp −Def', 'Mansa': '+AtEsp −Vel', 'Tímida': '', 'Alocada': '+AtEsp −DefEsp',
    'Serena': '+DefEsp −Atq', 'Amable': '+DefEsp −Def', 'Grosera': '+DefEsp −Vel', 'Cauta': '+DefEsp −AtEsp', 'Rara': ''
  }; // a partir de esta cantidad de miembros el team figura como Lleno
  var TABLAS = {
    equipos: ['id', 'nombre', 'emoji', 'lider', 'tipo', 'color', 'lore', 'orden', 'miembros'],
    territorios: ['id', 'nombre', 'tipo', 'estado', 'equipo', 'retador', 'ultimo', 'referencia', 'x', 'y', 'actualizado', 'region'],
    guerras: ['id', 'fecha', 'territorioId', 'territorio', 'accion', 'ganador', 'perdedor', 'resumen', 'nota'],
    torneos: ['id', 'nombre', 'fecha', 'formato', 'info', 'enlace', 'creado'],
    noticias: ['id', 'fecha', 'titulo', 'cuerpo'],
    combates: ['id', 'fecha', 'ganador', 'rival', 'equipoGanador', 'equipoRival', 'formato', 'nota'],
    grupos: ['id', 'nombre', 'enlace', 'miembros', 'actualizado', 'orden'],
    reglas: ['id', 'orden', 'titulo', 'texto', 'nota', 'destacada'],
    wiki: ['id', 'zona', 'resumen', 'notas', 'actualizado']
  };

  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function txt(v, max) {
    v = (v == null ? '' : String(v)).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
    return max ? v.slice(0, max) : v;
  }
  function largo(v, max) {
    v = (v == null ? '' : String(v)).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    return max ? v.slice(0, max) : v;
  }
  // Resúmenes propios de cada zona para la wiki (el admin los puede cambiar desde la web).
  var WIKI_RESUMENES = {
    "Pueblo Alba": "El pueblo donde arranca la aventura. El Profesor Oak entrega el primer compañero (Pikachu, Riolu o Eevee) y en la casa del protagonista se consiguen el mapa y las primeras pociones. Más adelante se abre la Granja Pokémon.",
    "Pueblo Valde": "Segunda parada del viaje, después de vencer al rival en la Ruta 1. Es el primer pueblo con Centro Pokémon y tienda, y tiene una Escuela Pokémon.",
    "Ciudad Spica": "La primera ciudad, tranquila y sencilla, a la que se llega por la Ruta 3. Tiene el primer gimnasio de la región, el Museo de la Ciencia, el laboratorio del Profesor Serbal y una casa donde los Pokémon pueden olvidar movimientos.",
    "Bosque Spica": "Bosque laberíntico entre las rutas 2 y 3, paso obligado hacia Ciudad Spica. Es el lugar ideal para sumar Pokémon tipo Bicho, Planta y Fantasma al principio; algunos árboles se cortan con Corte.",
    "Pueblo Talo": "Pueblo de lluvia constante donde los Slowpoke son queridos porque la invocan. Acá aparece por primera vez una banda criminal, y para seguir hacia la Ruta 6 hay que resolver lo que pasa en el Pozo Talo.",
    "Ciudad Naos": "Segunda ciudad del viaje, en el noroeste, con casas de tejado azul. Su gimnasio es de tipo Agua y tiene la Guardería Pokémon, donde se cruza por primera vez al Team Rocket.",
    "Ciudad Sirio": "Tercera ciudad, en el centro de la región, a la que se llega por la Ruta 10. Tiene un aire sombrío que combina con su gimnasio de tipo Siniestro y Fantasma.",
    "Ciudad Deneb": "Cuarta ciudad, cubierta de nieve casi todo el año; se llega por el Túnel Yucca. Al principio el gimnasio está cerrado y para el combate hay que atravesar la Cueva Helada.",
    "Bosque Místico": "Bosque al oeste de Ciudad Antares que se abre recién después de la Liga Star, cuando la historia avanza en Kanto y se gana la medalla de Lt. Surge.",
    "Ciudad Vega": "Quinta ciudad, tropical y con playa, a la que se llega por la Ruta 16. Tiene gimnasio de tipo Planta, el laboratorio del Profesor Elm, una carrera Pokémon y una comisaría.",
    "Playa Vega": "Playa al sur de Ciudad Vega a la que se entra después de conseguir la Regadera. En su extremo sur está la entrada a la Cueva Moonlight.",
    "Ciudad Polar": "Una de las ciudades más grandes, con casino y centro comercial, y con bandas criminales metidas en todo. Su gimnasio de tipo Dragón es el séptimo de la Liga Star.",
    "Ciudad Rigel": "Ciudad del desierto con estética de lejano oeste, a la que se llega cruzando el Desierto del Gaara. Lo primero es pasar por el Saloon Rigel; su gimnasio es de tipo Fuego.",
    "Ciudad Antares": "Ciudad exclusiva de Reloaded y la más avanzada de la región, con teletransportadores y suelo fotovoltaico. Su gimnasio es de tipo Psíquico y ahí se levanta el edificio más alto de Star.",
    "Pueblo Kena": "Cuarto pueblo de la región, con hierba alta propia y un intercambio Pokémon.",
    "Pueblo Luna": "Pueblo exclusivo de Star al que se llega después de la séptima medalla, por la Cueva Moonlight y la Ruta 19. La Ruta 20 lo une con Ciudad Antares y al norte están las Ruinas Omega.",
    "Pueblo Arcturus": "Uno de los asentamientos principales de La Jungla, escondido detrás de la Cueva Chuzo. Remoto y difícil de alcanzar, es el refugio ideal para quien no quiere ser encontrado.",
    "Pueblo Wezen": "Segundo pueblo de La Jungla, con nombre de una estrella del Can Mayor. Tiene encuentros especiales y mucho para surfear y pescar.",
    "Pueblo Régulo": "Pueblo de La Jungla que toma su nombre de la estrella Régulo.",
    "Pueblo Procyon": "Pueblo de La Jungla bautizado por Procyon, la estrella más brillante del Can Menor.",
    "Pueblo Niza": "La wiki lo registra como otro nombre de Pueblo Alba, el pueblo inicial. En la guerra de teams cuenta como una zona propia.",
    "Puerto Luz": "Puerto en el camino de Ciudad Antares hacia la Cueva Ardiente y la Isla Sol, entre las rutas 21, 22 y 24. Es de los lugares con más variedad de Pokémon en hierba, agua y pesca.",
    "Playa Naos": "Playa pegada a Ciudad Naos, del lado oeste de la ciudad.",
    "Isla Sol": "La isla de la Liga Pokémon. Antes hay que superar la Calle Victoria, llena de entrenadores de otros juegos; después de la Liga se abre la Ruta 25, donde esperan Latios y Latias.",
    "Isla Urano": "Primera isla del Archipiélago Solar y la que abre el viaje hacia las demás. Gira alrededor del tipo Volador: ahí está el gran estadio de Flygol.",
    "Isla Venus": "Isla del Archipiélago Solar dedicada al tipo Veneno, con mayoría de población femenina; ahí vive Tina, del Alto Mando Star. Su gran desafío es la Cueva Neith.",
    "Isla Terra": "Isla del Archipiélago Solar entre la Isla Magmática y la Isla Oceánica. Ahí está el Santuario Terra.",
    "Isla Marte": "Isla del Archipiélago Solar con el Dojo Marte: ganándolo se enfrenta a Aníbal por la Medalla Tormenta. Si se gana cinco veces seguidas, se abre la Cueva Roja.",
    "Isla Júpiter": "Isla del Archipiélago Solar con la Universidad Pokémon. Ahí está Petra, líder de Hoenn: para enfrentarla hay que sacarse un 10 en su examen.",
    "Isla Saturno": "Isla del Archipiélago Solar dedicada al tipo Eléctrico. Su gran desafío es el Laboratorio Voltio.",
    "Isla Neptuno": "Una de las islas del Archipiélago Solar, con nombre de planeta como sus vecinas.",
    "Islas Cometa": "Archipiélago parecido al Solar, con mapa propio. Se desbloquea después de la misión \"Encarcelado ¿Injustamente?\", del evento de Lem en la Isla Halley y de vencer a Violeta, la primera líder de Kalos.",
    "Archipiélago Solar": "Conjunto de islas con nombres de planetas del Sistema Solar, más algunas islas externas como la Isla del Frente o la Isla Halley.",
    "Gran Isla Estelar": "La isla principal de la Región Star, donde pasa casi toda la historia: los gimnasios, la Liga Star y la mayoría de las capturas.",
    "Zona Safari": "Área especial con Pokémon que no aparecen en otro lado. La entrada cuesta 5 € y tiene cuatro sectores (noroeste, noreste, suroeste y sureste), cada uno con encuentros distintos.",
    "La Jungla": "La segunda isla más grande de la región, tropical, calurosa y llena de Pokémon. Es la guarida del Team Rekiem, la organización criminal propia de Star, que bloquea el Teletransporte en la zona.",
    "Paraíso Floral": "Zona verde de la Ruta 20, entre Pueblo Luna y Ciudad Antares, con el suelo cubierto de flores y caminos unidos por puentes y escaleras. Abundan los Pokémon Bicho/Volador con forma de mariposa.",
    "Pantano Swamp": "Pantano entre Pueblo Kena y Ciudad Deneb que une la Ruta 15 con la Cueva Extravío. No tiene entrenadores; sobre el barro conviene moverse con Velocidad Extrema.",
    "Desierto de Gaara": "El único desierto de la región; hace falta la bicicleta para las rampas. Lo más buscado es Regigigas, cuya cueva se abre los domingos.",
    "Ruinas Omega": "Laberinto de salas y pasillos metido en una montaña al norte de Pueblo Luna.",
    "Cueva Helada": "Cueva de Ciudad Deneb que hay que cruzar para la cuarta medalla y la MO Vuelo. El hielo hace deslizar al personaje sin control, y de eso se tratan sus rompecabezas.",
    "Cueva Neith": "Cueva de la Isla Venus con niebla espesa y rocas que hay que mover para avanzar. Su nombre viene de una diosa egipcia.",
    "Cueva Rocosa": "Une Ciudad Polar con el Desierto del Gaara. Hace falta Fuerza: cada roca que se encaja en un hueco hace desaparecer otra grande. Conviene guardar seguido.",
    "Cueva Moonlight": "Conecta la Playa Vega con la Ruta 19. Tiene mucha variedad, incluida la legendaria Cresselia, y Pokémon que pueden llevar Piedra Solar o Piedra Lunar.",
    "Cueva Roja": "Cueva de la Isla Marte que se abre al ganar el Dojo Marte cinco veces. Adentro esperan Deoxys y la Mewtwoita.",
    "Liga Star": "La Liga de la Región Star, en la Isla Sol: el desafío final después de las ocho medallas.",
    "Torre pokémon": "Cementerio de la Ruta 9 donde se despide a los Pokémon, lleno de tipo Fantasma. Arriba vive el Gran Sabio Anciano, del que se dice que ve el futuro.",
    "Isla Calor": "Una de las tres islas, con Isla Energía e Isla Viento, que hay que recorrer para reunir las armas que abren el gimnasio de Locke y la Medalla Fábula.",
    "Isla Energía": "La segunda de las tres islas de las armas, junto a Isla Calor e Isla Viento. Paso obligado antes del gimnasio de Locke.",
    "Isla Viento": "La tercera isla de las armas. En la superficie no hay mucho: todo pasa adentro de la Cueva Vendaval."
    };
  function slug(s) {
    return txt(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  function igual(a, b) { return txt(a).toLowerCase() === txt(b).toLowerCase(); }
  function porId(lista, id) { for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i]; return null; }
  function falla(m) { throw new Error(m); }
  function color(c, def) { c = txt(c); return /^#[0-9a-f]{6}$/i.test(c) ? c : def; }
  function cantidad(v) { var n = Math.floor(Number(v)); return isFinite(n) && n > 0 ? Math.min(n, 999) : 0; }
  function enlace(u) { u = txt(u, 300); return /^https?:\/\//i.test(u) ? u : ''; }
  function equipoValido(db, nombre) {
    nombre = txt(nombre, 60); if (!nombre) return '';
    for (var i = 0; i < db.equipos.length; i++) if (igual(db.equipos[i].nombre, nombre)) return db.equipos[i].nombre;
    return falla('No existe el team "' + nombre + '".');
  }
  function quitar(lista, id) {
    for (var i = 0; i < lista.length; i++) if (lista[i].id === id) { lista.splice(i, 1); return true; }
    return falla('Ese registro ya no existe. Recargá la página.');
  }

  function semilla() {
    var equipos = [
      ['rocket', 'Team Rocket', '🚀', '#ff815b', 'Estrategas de movimientos rápidos: valoran la astucia, la coordinación y saber cuándo dar el siguiente paso.'],
      ['magma', 'Team Magma', '🌋', '#ff9d58', 'Un clan de voluntad firme que apuesta por la disciplina, la resistencia y avanzar unido.'],
      ['aqua', 'Team Aqua', '🌊', '#73c9f1', 'Exploradores flexibles: se adaptan al terreno y prefieren ganar con paciencia y cooperación.'],
      ['galaxia', 'Team Galaxia', '🌌', '#c591ff', 'Un equipo metódico que busca orden, precisión y una visión compartida para cada desafío.'],
      ['plasma', 'Team Plasma', '⚡', '#a4d6f5', 'Entrenadores idealistas que ponen sus convicciones y el compañerismo en el centro.'],
      ['flare', 'Team Flare', '🔥', '#fd6955', 'Un grupo de presencia fuerte, enfocado en la estrategia, el estilo y el control de sus zonas.'],
      ['rekiem', 'Team Rekiem', '👁️', '#d6a6ff', 'Organización reservada y decidida; sus objetivos y motivaciones quedan en misterio, sin revelar la trama.'],
      ['elite', 'Escuadrón Élite', '⭐', '#c8f169', 'Fuerza de protección de la Región Star: prioriza el resguardo de civiles, el orden y la respuesta ante conflictos.'],
      ['delta', 'Team Delta', '🟢', '#8eea66', 'Clan emergente de origen desconocido. Su identidad y sus motivos se irán revelando en el roleo de la comunidad.']
    ].map(function (e, i) {
      return { id: e[0], nombre: e[1], emoji: e[2], lider: LIDERES[e[1]] || '—', tipo: e[1] === 'Team Delta' ? 'Clan nuevo' : 'Escuadrón', color: e[3], lore: e[4], orden: String(i + 1), miembros: '0' };
    });
    var zonas = [
      ['Pueblo Alba', 'Pueblo'], ['Pueblo Valde', 'Pueblo'], ['Ciudad Spica', 'Ciudad'], ['Bosque Spica', 'Bosque'], ['Pueblo Talo', 'Pueblo'],
      ['Ciudad Naos', 'Ciudad', 'Noroeste de la Región Star'], ['Ciudad Sirio', 'Ciudad', 'Centro de la Región Star'], ['Ciudad Deneb', 'Ciudad'],
      ['Bosque Místico', 'Bosque'], ['Ciudad Vega', 'Ciudad', 'Al norte de Playa Vega'], ['Playa Vega', 'Playa'], ['Ciudad Polar', 'Ciudad'],
      ['Ciudad Rigel', 'Ciudad'], ['Ciudad Antares', 'Ciudad'], ['Pueblo Kena', 'Pueblo'], ['Pueblo Luna', 'Pueblo'], ['Pueblo Arcturus', 'Pueblo'],
      ['Pueblo Wezen', 'Pueblo'], ['Pueblo Régulo', 'Pueblo'], ['Pueblo Procyon', 'Pueblo'], ['Pueblo Niza', 'Pueblo'], ['Puerto Luz', 'Puerto'],
      ['Playa Naos', 'Playa'], ['Isla Sol', 'Isla'], ['Isla Urano', 'Isla'], ['Isla Venus', 'Isla'], ['Isla Terra', 'Isla'], ['Isla Marte', 'Isla'],
      ['Isla Júpiter', 'Isla'], ['Isla Saturno', 'Isla'], ['Isla Neptuno', 'Isla'], ['Islas Cometa', 'Archipiélago'], ['Archipiélago Solar', 'Archipiélago'],
      ['Gran Isla Estelar', 'Región'], ['Zona Safari', 'Zona natural'], ['La Jungla', 'Zona natural'], ['Paraíso Floral', 'Zona natural'],
      ['Pantano Swamp', 'Pantano'], ['Desierto de Gaara', 'Desierto'], ['Ruinas Omega', 'Ruinas'], ['Cueva Helada', 'Cueva'], ['Cueva Neith', 'Cueva'],
      ['Cueva Rocosa', 'Cueva'], ['Cueva Moonlight', 'Cueva'], ['Cueva Roja', 'Cueva'], ['Banco Star', 'Edificio'],
      ['Centro de Investigación y Tecnología', 'Edificio'], ['Edificio Scorpio', 'Edificio'], ['Liga Star', 'Liga']
    ];
    var control = {
      'Ciudad Sirio': ['Team Rekiem', 'Team Rekiem conquistó Ciudad Sirio.', 'conquista', '—'],
      'Ciudad Deneb': ['Team Delta', 'Team Delta tomó Ciudad Deneb después de que quedara libre del Team Flare.', 'toma', 'Zona libre'],
      'Bosque Místico': ['Escuadrón Élite', 'Escuadrón Élite tomó y resguardó Bosque Místico de futuras amenazas.', 'resguardo', '—']
    };
    var territorios = [], guerras = [];
    zonas.forEach(function (z) {
      var c = control[z[0]], id = 'z-' + slug(z[0]);
      territorios.push({ id: id, nombre: z[0], tipo: z[1], estado: c ? 'Controlada' : 'Neutral', equipo: c ? c[0] : '', retador: '',
        ultimo: c ? c[1] : 'Zona neutral', referencia: z[2] || '', x: '', y: '', actualizado: '', region: EN_JUNGLA.indexOf(z[0]) >= 0 ? 'jungla' : 'star' });
      if (c) guerras.push({ id: 'g-' + slug(z[0]), fecha: 'Parte inicial', territorioId: id, territorio: z[0], accion: c[2], ganador: c[0], perdedor: c[3], resumen: c[1], nota: '' });
    });
    return {
      reglas: [
        { id: 'r1', orden: '1', titulo: 'Reunir y anunciar', texto: 'Para reclamar una zona enemiga tienen que llegar 4 o 5 integrantes y anunciar su llegada en el grupo.', nota: '', destacada: '' },
        { id: 'r2', orden: '2', titulo: 'Zona sin defensores', texto: 'Si revisan la ciudad y no hay nadie defendiéndola, el team atacante puede tomarla.', nota: '', destacada: '' },
        { id: 'r3', orden: '3', titulo: 'Batalla por la ciudad', texto: 'Si hay defensores, se resuelve con una batalla Pokémon. El bando derrotado se retira.', nota: '', destacada: '' },
        { id: 'r4', orden: '4', titulo: 'Estado de vagabundo', texto: 'Quienes pierdan defendiendo no pueden volver a pelear por esa ciudad durante 24 horas. Sí pueden atacar otra ciudad enemiga.', nota: '', destacada: '' },
        { id: 'r5', orden: '5', titulo: 'Prueba del resultado', texto: 'Compartan una captura de la victoria para confirmar el resultado y evitar malentendidos.', nota: '', destacada: '' },
        { id: 'r6', orden: '6', titulo: 'Puntos muertos', texto: 'Una ciudad sin miembros reclutados de un team queda como Punto Muerto hasta que alguien la reclame. El primer team que llegue puede hacerlo.', nota: '', destacada: '' },
        { id: 'r7', orden: '7', titulo: 'Recuperar territorio', texto: 'Si un team vuelve a reclutar miembros y su ciudad está ocupada, tiene que luchar para recuperarla.', nota: '', destacada: '' },
        { id: 'r8', orden: '8', titulo: 'Intervención del Escuadrón Élite', texto: 'Si el Escuadrón Élite derrota a 4 o 5 miembros de un team en guerra, el castigo previsto es que todo ese team quede preso por 4 días.', nota: 'La aplicación de esta sanción todavía está en construcción.', destacada: '1' }
      ],
      wiki: Object.keys(WIKI_RESUMENES).map(function (z) { return { id: 'w-' + slug(z), zona: z, resumen: WIKI_RESUMENES[z], notas: '', actualizado: '' }; }),
      grupos: [
        { id: 'g-online', nombre: 'Grupo de Online', enlace: 'https://chat.whatsapp.com/BRLTjIxYjFKGg16dBMsAJH', miembros: '0', actualizado: '', orden: '1' },
        { id: 'g-general', nombre: 'Grupo general', enlace: 'https://chat.whatsapp.com/Fqqo0nNf4CW9fMEpXaeVr6', miembros: '0', actualizado: '', orden: '2' }
      ],
      equipos: equipos, territorios: territorios, guerras: guerras, torneos: [], combates: [],
      noticias: [{ id: 'n-inicial', fecha: 'Parte territorial', titulo: 'La disputa por Star se intensifica',
        cuerpo: 'La Comisaría confirmó nuevos movimientos: Team Rekiem controla Ciudad Sirio; Team Delta tomó Ciudad Deneb, recuperada previamente del Team Flare; y el Escuadrón Élite resguarda el Bosque Místico. Tras los reportes de policías heridos, las autoridades piden mantener la calma y no involucrarse con organizaciones enemigas. El origen de Team Delta sigue sin esclarecerse.' }]
    };
  }

  /** Valida y limpia los datos de un carnet de entrenador. */
  function limpiarCarnet(p, equipos) {
    p = p || {};
    var nombre = txt(p.nombre, 24);
    if (nombre.length < 2) falla('Escribí tu nombre de entrenador (mínimo 2 letras).');
    var equipo = '';
    if (txt(p.equipo)) {
      for (var i = 0; i < equipos.length; i++) if (igual(equipos[i].nombre, p.equipo)) equipo = equipos[i].nombre;
      if (!equipo) falla('Ese team no existe.');
    }
    var lista = Array.isArray(p.pokemon) ? p.pokemon : [];
    var pokemon = lista.slice(0, 6).map(function (x) {
      x = x || {};
      var especie = txt(x.especie, 24); if (!especie) return null;
      var t1 = TIPOS.indexOf(x.tipo1) >= 0 ? x.tipo1 : '', t2 = TIPOS.indexOf(x.tipo2) >= 0 && x.tipo2 !== t1 ? x.tipo2 : '';
      if (!t1 && t2) { t1 = t2; t2 = ''; }
      var nv = Math.floor(Number(x.nivel));
      return {
        especie: especie, apodo: txt(x.apodo, 16), nivel: nv >= 1 && nv <= 100 ? String(nv) : '', tipo1: t1, tipo2: t2,
        habilidad: txt(x.habilidad, 28), objeto: txt(x.objeto, 28),
        naturaleza: Object.prototype.hasOwnProperty.call(NATURALEZAS, x.naturaleza) ? x.naturaleza : '',
        movimientos: (Array.isArray(x.movimientos) ? x.movimientos : []).slice(0, 4).map(function (m) { return txt(m, 24); }).filter(Boolean),
        shiny: x.shiny === true || x.shiny === 'true'
      };
    }).filter(Boolean);
    return { nombre: nombre, equipo: equipo, usuario: txt(p.usuario, 24), lema: txt(p.lema, 90), pvp: p.pvp === true || p.pvp === 'true', pokemon: pokemon };
  }

  function renombrarEquipo(db, viejo, nuevo) {
    if (viejo === nuevo) return;
    db.territorios.forEach(function (t) { if (t.equipo === viejo) t.equipo = nuevo; if (t.retador === viejo) t.retador = nuevo; });
    db.guerras.forEach(function (g) { if (g.ganador === viejo) g.ganador = nuevo; if (g.perdedor === viejo) g.perdedor = nuevo; });
    db.combates.forEach(function (c) { if (c.equipoGanador === viejo) c.equipoGanador = nuevo; if (c.equipoRival === viejo) c.equipoRival = nuevo; });
  }

  function aplicar(db, op, p, ctx) {
    p = p || {};
    var ahora = ctx.ahora, x, t, i;
    if (!ctx.admin) falla('Esta acción es solo para admins.');
    switch (op) {
      case 'equipoGuardar': {
        var n = txt(p.nombre, 40); if (!n) falla('Escribí el nombre del team.');
        for (i = 0; i < db.equipos.length; i++) if (db.equipos[i].id !== p.id && igual(db.equipos[i].nombre, n)) falla('Ya existe un team con ese nombre.');
        x = p.id ? porId(db.equipos, p.id) : null;
        if (p.id && !x) falla('Ese team ya no existe.');
        if (!x) { x = { id: uid(), orden: String(db.equipos.length + 1) }; db.equipos.push(x); }
        var viejo = x.nombre;
        x.nombre = n; x.emoji = txt(p.emoji, 8) || '✦'; x.lider = txt(p.lider, 40) || '—'; x.tipo = txt(p.tipo, 30) || 'Equipo comunitario';
        x.color = color(p.color, x.color || '#f4d38b'); x.lore = largo(p.lore, 600);
        if (p.miembros != null && p.miembros !== '') x.miembros = String(cantidad(p.miembros)); else if (!x.miembros) x.miembros = '0';
        if (viejo) renombrarEquipo(db, viejo, n);
        return { cambios: ['equipos', 'territorios', 'guerras', 'combates'] };
      }
      case 'equipoBorrar': quitar(db.equipos, p.id); return { cambios: ['equipos'] };
      case 'equipoMiembros': {
        x = porId(db.equipos, p.id) || falla('Ese team ya no existe.');
        var actual = cantidad(x.miembros);
        x.miembros = String(cantidad(p.valor != null && p.valor !== '' ? p.valor : actual + (Number(p.delta) || 0)));
        return { cambios: ['equipos'] };
      }
      case 'equiposRestaurar': {
        semilla().equipos.forEach(function (e) {
          var ya = db.equipos.filter(function (q) { return igual(q.nombre, e.nombre); })[0];
          if (!ya) db.equipos.push(e); else { ya.color = ya.color || e.color; ya.lore = ya.lore || e.lore; ya.emoji = ya.emoji || e.emoji; }
        });
        return { cambios: ['equipos'] };
      }
      case 'torneoGuardar': {
        if (!txt(p.nombre)) falla('Escribí el nombre del torneo.');
        x = p.id ? porId(db.torneos, p.id) : null;
        if (!x) { x = { id: uid(), creado: ahora }; db.torneos.unshift(x); }
        x.nombre = txt(p.nombre, 80); x.fecha = txt(p.fecha, 60) || 'Fecha por definir'; x.formato = txt(p.formato, 60) || 'Formato por definir';
        x.info = largo(p.info, 500); x.enlace = enlace(p.enlace);
        return { cambios: ['torneos'] };
      }
      case 'torneoBorrar': quitar(db.torneos, p.id); return { cambios: ['torneos'] };
      case 'noticiaGuardar': {
        if (!txt(p.titulo)) falla('La noticia necesita un título.');
        // La noticia puede traer el cambio de una zona: se registra en la crónica y en el atlas al mismo tiempo.
        var zonaCambios = [];
        if (p.zona && p.zona.territorio) zonaCambios = aplicar(db, 'guerraRegistrar', p.zona, ctx).cambios;
        x = p.id ? porId(db.noticias, p.id) : null;
        if (!x) { x = { id: uid(), fecha: ahora }; db.noticias.unshift(x); }
        x.titulo = txt(p.titulo, 90); x.cuerpo = largo(p.cuerpo, 900);
        return { cambios: ['noticias'].concat(zonaCambios) };
      }
      case 'noticiaBorrar': quitar(db.noticias, p.id); return { cambios: ['noticias'] };
      case 'reglaGuardar': {
        db.reglas = db.reglas || [];
        if (!txt(p.titulo)) falla('La regla necesita un título.');
        if (!String(p.texto || '').trim()) falla('Escribí qué dice la regla.');
        x = p.id ? porId(db.reglas, p.id) : null;
        if (p.id && !x) falla('Esa regla ya no existe.');
        if (!x) {
          x = { id: uid(), orden: String(db.reglas.reduce(function (m, r) { return Math.max(m, Number(r.orden) || 0); }, 0) + 1) };
          db.reglas.push(x);
        }
        x.titulo = txt(p.titulo, 60); x.texto = largo(p.texto, 600); x.nota = txt(p.nota, 200);
        x.destacada = p.destacada === true || p.destacada === '1' || p.destacada === 'si' ? '1' : '';
        return { cambios: ['reglas'] };
      }
      case 'reglaBorrar': db.reglas = db.reglas || []; quitar(db.reglas, p.id); return { cambios: ['reglas'] };
      case 'reglaMover': {
        db.reglas = db.reglas || [];
        var lista = db.reglas.slice().sort(function (a, b) { return (Number(a.orden) || 0) - (Number(b.orden) || 0); });
        var i = lista.findIndex(function (r) { return r.id === p.id; });
        if (i < 0) falla('Esa regla ya no existe.');
        var j = i + (Number(p.dir) < 0 ? -1 : 1);
        if (j >= 0 && j < lista.length) { var tmp = lista[i]; lista[i] = lista[j]; lista[j] = tmp; }
        lista.forEach(function (r, k) { r.orden = String(k + 1); });
        return { cambios: ['reglas'] };
      }
      case 'wikiGuardar': {
        db.wiki = db.wiki || [];
        var zw = txt(p.zona, 80); if (!zw) falla('Falta la zona.');
        x = db.wiki.find(function (w) { return w.zona === zw; });
        if (!x) { x = { id: 'w-' + slug(zw), zona: zw }; db.wiki.push(x); }
        x.resumen = largo(p.resumen, 1200); x.notas = largo(p.notas, 1500); x.actualizado = ahora;
        return { cambios: ['wiki'] };
      }
      case 'grupoMiembros': {
        db.grupos = db.grupos || [];
        x = porId(db.grupos, p.id) || falla('Ese grupo ya no existe.');
        var gm = Math.floor(Number(p.valor));
        x.miembros = String(isFinite(gm) && gm > 0 ? Math.min(gm, 100000) : 0); x.actualizado = ahora;
        return { cambios: ['grupos'] };
      }
      case 'combateGuardar': {
        var gan = txt(p.ganador, 40), riv = txt(p.rival, 40);
        if (!gan || !riv) falla('Completá ganador y rival.');
        db.combates.unshift({ id: uid(), fecha: ahora, ganador: gan, rival: riv, equipoGanador: equipoValido(db, p.equipoGanador),
          equipoRival: equipoValido(db, p.equipoRival), formato: txt(p.formato, 50) || 'Combate', nota: txt(p.nota, 160) });
        return { cambios: ['combates'] };
      }
      case 'combateBorrar': quitar(db.combates, p.id); return { cambios: ['combates'] };
      case 'zonaGuardar': {
        var zn = txt(p.nombre, 60); if (!zn) falla('Escribí el nombre de la zona.');
        for (i = 0; i < db.territorios.length; i++) if (db.territorios[i].id !== p.id && igual(db.territorios[i].nombre, zn)) falla('Esa zona ya está en el atlas.');
        x = p.id ? porId(db.territorios, p.id) : null;
        if (!x) { x = { id: 'z-' + slug(zn) + '-' + uid().slice(-3), estado: 'Neutral', equipo: '', retador: '', ultimo: 'Zona neutral', x: '', y: '', actualizado: ahora, region: 'star' }; db.territorios.push(x); }
        var antes = x.nombre, rg = region(p.region);
        x.nombre = zn; x.tipo = txt(p.tipo, 30) || 'Zona'; x.referencia = txt(p.referencia, 120);
        // Si cambia de región, el punto que tenía era sobre el otro mapa: queda para volver a ubicarla.
        if (rg && rg !== regionDe(x)) { x.x = ''; x.y = ''; }
        if (rg) x.region = rg; else if (!x.region) x.region = 'star';
        if (antes && antes !== zn) db.guerras.forEach(function (g) { if (g.territorioId === x.id) g.territorio = zn; });
        return { cambios: ['territorios', 'guerras'], resultado: { id: x.id } };
      }
      case 'zonaBorrar': {
        quitar(db.territorios, p.id);
        db.guerras = db.guerras.filter(function (g) { return g.territorioId !== p.id; });
        return { cambios: ['territorios', 'guerras'] };
      }
      case 'zonaUbicar': {
        t = porId(db.territorios, p.id) || falla('Esa zona ya no existe.');
        if (p.x === '' || p.x == null) { t.x = ''; t.y = ''; }
        else {
          var px = Number(p.x), py = Number(p.y);
          if (!(px >= 0 && px <= 100 && py >= 0 && py <= 100)) falla('Posición fuera del mapa.');
          t.x = px.toFixed(2); t.y = py.toFixed(2);
          // El punto queda en el mapa donde se tocó (Región Star o La Jungla).
          if (region(p.region)) t.region = region(p.region);
        }
        if (!t.region) t.region = 'star';
        return { cambios: ['territorios'] };
      }
      case 'guerraRegistrar': {
        t = porId(db.territorios, p.territorio) || falla('No encontré esa zona.');
        var ac = p.accion; if (!ACCIONES[ac]) falla('Elegí qué pasó en la zona.');
        var g = equipoValido(db, p.ganador), l = p.perdedor ? equipoValido(db, p.perdedor) : '', r = '';
        if (['conquista', 'toma', 'defensa', 'resguardo'].indexOf(ac) >= 0 && !g) falla('Elegí el team que ganó o tomó la zona.');
        if (g && l && g === l) falla('El ganador y el rival no pueden ser el mismo team.');
        if (ac === 'conquista') { l = l || t.equipo; t.estado = 'Controlada'; t.equipo = g; t.retador = ''; r = g + ' conquistó ' + t.nombre + (l && l !== g ? ' a ' + l : ''); }
        else if (ac === 'toma') { t.estado = 'Controlada'; t.equipo = g; t.retador = ''; l = 'Zona libre'; r = g + ' tomó ' + t.nombre + ' (zona libre)'; }
        else if (ac === 'defensa') { l = l || t.retador; t.estado = 'Controlada'; t.equipo = g; t.retador = ''; r = g + ' defendió ' + t.nombre + (l ? ' ante ' + l : ''); }
        else if (ac === 'disputa') { t.estado = 'En disputa'; t.retador = (g && g !== t.equipo) ? g : l; r = 'Disputa abierta en ' + t.nombre + (g ? ': ' + g : '') + (l ? ' contra ' + l : ''); }
        else if (ac === 'liberacion') { l = l || t.equipo; t.estado = 'Neutral'; t.equipo = ''; t.retador = ''; r = t.nombre + ' quedó liberada y neutral' + (l ? ' tras dejar el control de ' + l : ''); }
        else if (ac === 'muerto') { l = l || t.equipo; t.estado = 'Punto Muerto'; t.equipo = ''; t.retador = ''; r = t.nombre + ' quedó como Punto Muerto' + (l ? ' al quedar sin miembros de ' + l : ''); }
        else if (ac === 'resguardo') { t.estado = 'Controlada'; t.equipo = g; t.retador = ''; r = g + ' resguardó ' + t.nombre + (l ? ' ante ' + l : ''); }
        if (txt(p.referencia)) t.referencia = txt(p.referencia, 120);
        t.ultimo = r; t.actualizado = ahora;
        db.guerras.unshift({ id: uid(), fecha: ahora, territorioId: t.id, territorio: t.nombre, accion: ac, ganador: g || '', perdedor: l || '', resumen: r, nota: txt(p.nota, 200) });
        return { cambios: ['territorios', 'guerras'] };
      }
      case 'guerraBorrar': quitar(db.guerras, p.id); return { cambios: ['guerras'] };
    }
    return falla('Acción desconocida: ' + op);
  }

  function vista(db, admin) {
    var equipos = db.equipos.slice().sort(function (a, b) { return (Number(a.orden) || 999) - (Number(b.orden) || 999); });
    return {
      equipos: equipos,
      territorios: db.territorios, guerras: admin ? db.guerras : db.guerras.slice(0, 250),
      torneos: db.torneos, noticias: db.noticias.slice(0, admin ? 500 : 60), combates: db.combates.slice(0, admin ? 500 : 60),
      grupos: (db.grupos || []).slice().sort(function (a, b) { return (Number(a.orden) || 99) - (Number(b.orden) || 99); }),
      reglas: (db.reglas || []).slice().sort(function (a, b) { return (Number(a.orden) || 0) - (Number(b.orden) || 0); }),
      wiki: db.wiki || []
    };
  }

  return { aplicar: aplicar, vista: vista, semilla: semilla, TABLAS: TABLAS, ACCIONES: ACCIONES, ESTADOS: ESTADOS, CUPO: CUPO, LIDERES: LIDERES, TIPOS: TIPOS, NATURALEZAS: NATURALEZAS, limpiarCarnet: limpiarCarnet, cantidad: cantidad, txt: txt, REGIONES: REGIONES, region: region, regionDe: regionDe, regionInicial: regionInicial };
})();
// ===== FIN DEL NÚCLEO =====
// Si alojás este HTML fuera de Google (GitHub Pages, etc.), pegá acá la URL /exec de tu Apps Script.
const API_URL = 'https://script.google.com/macros/s/AKfycbw3y8HEUodf4NRaMdMQy8s4Fa6GcQJAjFVaNaSTveDPZ6MGtiTBMfGJPnFrq_YYtFyAcw/exec';
// Dirección pública de la página (para compartir noticias). Si queda vacía se usa la actual.
const SITIO_URL = 'https://stormacher95.github.io/';
const WPP_ONLINE = 'https://chat.whatsapp.com/BRLTjIxYjFKGg16dBMsAJH';
// En GitHub Pages la web está separada en páginas; la versión de Apps Script es una sola página.
const MULTIPAGINA = true;
// Contador de visitas anónimo (GoatCounter, sin cookies). Solo en la web publicada: no cuenta las pruebas ni la versión de Apps Script.
if (location.hostname === 'stormacher95.github.io') {
  const gc = document.createElement('script');
  gc.async = true; gc.dataset.goatcounter = 'https://reloaded-online.goatcounter.com/count'; gc.src = 'https://gc.zgo.at/count.js';
  document.head.appendChild(gc);
}
const PAGINA_DE = { inicio: '/', mapa: '/#mapa', sumate: '/#sumate', explora: '/#explora', teams: '/teams.html', entrenadores: '/carnets.html', atlas: '/atlas.html', wiki: '/wiki.html', rutas: '/wiki/rutas.html', pokedex: '/wiki/pokedex.html', legendarios: '/wiki/legendarios.html', gimnasios: '/wiki/gimnasios.html', objetos: '/wiki/objetos.html', guias: '/wiki/guias.html', personajes: '/wiki/personajes.html', movimientos: '/wiki/movimientos.html', habilidades: '/wiki/habilidades.html', tipos: '/wiki/tipos.html', cronica: '/cronica.html', torneos: '/torneos.html', comunidad: '/comunidad.html', juego: '/comunidad.html#juego', creditos: '/comunidad.html#creditos', reglas: '/reglas.html', horario: '/reglas.html#horario', legal: '/legal.html' };
const hay = s => !!document.querySelector(s);
// Grupo general: ahí se piden los ingresos a los teams.
const WPP_GENERAL = 'https://chat.whatsapp.com/Fqqo0nNf4CW9fMEpXaeVr6';

const MODO = (window.google && google.script && google.script.run) ? 'drive' : (API_URL ? 'remoto' : 'demo');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const vacio = () => ({ equipos: [], territorios: [], guerras: [], torneos: [], noticias: [], combates: [], grupos: [], config: {} });
const S = { d: vacio(), token: '', rol: '', cargando: true, filtro: 'Todos', q: '', ubicando: null, verGuerras: 12, tipeado: false, region: 'star' };
const almacen = { get(k) { try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; } }, set(k, v) { try { v ? sessionStorage.setItem(k, v) : sessionStorage.removeItem(k); } catch (e) { } } };

// ---------- Datos de demostración (solo cuando no hay Drive) ----------
const Demo = {
  k: 'reloaded-online-demo-v1', mem: null, mapa: '', mapaJungla: '',
  db() { if (this.mem) return this.mem; try { const r = localStorage.getItem(this.k); if (r) return (this.mem = JSON.parse(r)); } catch (e) { } return (this.mem = Core.semilla()); },
  guardar() { try { localStorage.setItem(this.k, JSON.stringify(this.mem)); } catch (e) { } },
  vista(admin) {
    const v = JSON.parse(JSON.stringify(Core.vista(this.db(), admin)));
    const star = { url: this.mapa || 'mapa-territorial-reloaded-online.png' };
    v.config = { modo: 'demo', mapa: star, mapas: { star, jungla: this.mapaJungla ? { url: this.mapaJungla } : null }, ahora: new Date().toISOString(), cupo: this.cupoDemo || Core.CUPO };
    return v;
  },
  api(a, p, tok) {
    const ctx = { ahora: new Date().toISOString(), admin: true };
    if (a === 'datos') return this.vista(false);
    const dc = DemoC.leer(), pub = c => { const o = Object.assign({}, c); delete o.clave; o.captura = c.capturaEstado === 'aprobada' ? { url: c.capturaData } : null; o.capturaPendiente = c.capturaEstado === 'pendiente'; delete o.capturaData; delete o.capturaEstado; return o; };
    const dbusca = id => dc.find(x => x.id === id) || (() => { throw new Error('Ese carnet no existe o fue borrado.'); })();
    if (a === 'entrenadores') return dc.map(c => ({ id: c.id, numero: c.numero, nombre: c.nombre, equipo: c.equipo, pvp: c.pvp, creado: c.creado, foto: c.capturaEstado === 'aprobada', poke: c.pokemon.map(x => ({ e: x.especie, a: x.apodo, t: x.tipo1, t2: x.tipo2, s: x.shiny })) }));
    if (a === 'carnet') return pub(dbusca(p.id));
    if (a === 'carnetCrear') {
      if (String(p.clave || '').length < 4) throw new Error('La clave necesita al menos 4 caracteres.');
      const d = Core.limpiarCarnet(p, this.db().equipos);
      if (dc.some(x => x.nombre.toLowerCase() === d.nombre.toLowerCase())) throw new Error('Ya hay un carnet con ese nombre de entrenador.');
      const c = Object.assign({ id: 'c' + Date.now().toString(36), numero: String(dc.reduce((m, x) => Math.max(m, Number(x.numero)), 0) + 1), creado: ctx.ahora, actualizado: ctx.ahora, clave: p.clave }, d);
      dc.push(c); DemoC.guardar(dc); return pub(c);
    }
    if (a === 'carnetVerificar') { if (dbusca(p.id).clave !== p.clave) throw new Error('Clave incorrecta.'); return { ok: true }; }
    if (a === 'carnetEditar') {
      const c = dbusca(p.id); if (tok !== 'demo-token' && c.clave !== p.clave) throw new Error('Clave incorrecta.');
      const d = Core.limpiarCarnet(p, this.db().equipos);
      if (dc.some(x => x.id !== c.id && x.nombre.toLowerCase() === d.nombre.toLowerCase())) throw new Error('Ya hay un carnet con ese nombre de entrenador.');
      Object.assign(c, d, { actualizado: ctx.ahora }); if (p.nuevaClave) c.clave = p.nuevaClave;
      DemoC.guardar(dc); return pub(c);
    }
    if (a === 'carnetBorrarPropio') { const c = dbusca(p.id); if (c.clave !== p.clave) throw new Error('Clave incorrecta.'); DemoC.guardar(dc.filter(x => x.id !== c.id)); return { borrado: true }; }
    if (a === 'contacto') { if (String(p.mensaje || '').trim().length < 10) throw new Error('Contanos un poco más en el mensaje (mínimo 10 caracteres).'); return { enviado: true }; }
    if (a === 'login') { if (p.clave !== 'demo') throw new Error('Clave incorrecta. En la demostración la clave es "demo".'); return { token: 'demo-token' }; }
    if (a === 'imagen') throw new Error('Sin imagen');
    if (tok !== 'demo-token') throw new Error('Tu sesión de admin venció. Volvé a ingresar.');
    if (a === 'logout') return true;
    if (a === 'adminDatos') return this.vista(true);
    if (a === 'carnetBorrar') { DemoC.guardar(dc.filter(x => x.id !== p.id)); return { borrado: true }; }
    if (a === 'mensajes' || a === 'mensajeBorrar') return [];
    if (a === 'cupo') { const n = Math.floor(Number(p.valor)); if (!(n >= 1 && n <= 999)) throw new Error('El cupo tiene que ser un número entre 1 y 999.'); this.cupoDemo = n; return this.vista(true); }
    if (a === 'carnetClave') { const c = dbusca(p.id); c.clave = Math.random().toString(36).slice(2, 8); DemoC.guardar(dc); return { clave: c.clave }; }
    if (a === 'clave') throw new Error('En la demostración la clave siempre es "demo". Con Drive conectado se cambia de verdad.');
    if (a === 'mapaSubir') { this[Core.region(p.region) === 'jungla' ? 'mapaJungla' : 'mapa'] = 'data:' + p.mime + ';base64,' + p.base64; return this.vista(true); }
    Core.aplicar(this.db(), a, p, ctx); this.guardar(); return this.vista(true);
  }
};

const DemoC = {
  k: 'reloaded-carnets-demo', mem: null,
  leer() { if (this.mem) return this.mem; try { this.mem = JSON.parse(localStorage.getItem(this.k) || '[]'); } catch (e) { this.mem = []; } return this.mem; },
  guardar(l) { this.mem = l; try { localStorage.setItem(this.k, JSON.stringify(l)); } catch (e) { } }
};

function llamar(action, payload = {}) {
  if (MODO === 'drive') return new Promise((ok, ko) => google.script.run
    .withSuccessHandler(r => r && r.ok ? ok(r.data) : ko(new Error((r && r.error) || 'El servidor no respondió bien.')))
    .withFailureHandler(e => ko(new Error((e && e.message) || 'No hubo conexión con Drive.')))
    .api(action, payload, S.token));
  if (MODO === 'remoto') return fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, payload, token: S.token }) })
    .then(r => r.json()).then(r => { if (!r.ok) throw new Error(r.error); return r.data; });
  return new Promise((ok, ko) => setTimeout(() => { try { ok(Demo.api(action, payload, S.token)); } catch (e) { ko(e); } }, 150));
}

async function accion(action, payload, msg) {
  try {
    const r = await llamar(action, payload);
    if (r && r.equipos) S.d = r;
    render();
    if (msg) toast(msg);
    return r;
  } catch (e) {
    if (/sesión de admin venció/i.test(e.message)) salirAdmin(true);
    throw e;
  }
}

async function cargar(silencioso) {
  try {
    S.d = await llamar(S.token ? 'adminDatos' : 'datos');
    if (!S.token && MODO !== 'demo') try { localStorage.setItem('rlo-cache-v1', JSON.stringify(S.d)); } catch (e) { }
    if (hay('#gridCarnets')) cargarCarnets();
  }
  catch (e) {
    if (S.token) { salirAdmin(true); try { S.d = await llamar('datos'); } catch (_) { } }
    else if (!silencioso) toast('No pude cargar los datos: ' + e.message, 'error');
  }
  S.cargando = false; render();
}

// ---------- Utilidades de presentación ----------
const esAdmin = () => !!S.token && S.rol !== 'editor';
const esEditor = () => !!S.token && S.rol === 'editor';
const puedeNoticias = () => !!S.token;
const puedeGuerra = () => !!S.token; // admin y noticiero
const equipo = n => S.d.equipos.find(e => e.nombre === n);
const colorEq = n => (equipo(n) || {}).color || '#93b9c3';
function colorZona(t) {
  if (t.estado === 'Controlada') return colorEq(t.equipo);
  if (t.estado === 'En disputa') return '#ef5a5f';
  if (t.estado === 'Punto Muerto') return '#7d97a1';
  return '#c7d6da';
}
function fecha(s, conHora = true) {
  const d = new Date(s);
  if (!s || isNaN(d)) return esc(s || '');
  const o = conHora ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', year: 'numeric' };
  return esc(new Intl.DateTimeFormat('es-AR', o).format(d));
}
function pintar(texto) {
  const h = esc(texto), nombres = S.d.equipos.map(e => e.nombre).filter(Boolean).sort((a, b) => b.length - a.length);
  if (!nombres.length) return h;
  const re = new RegExp(nombres.map(n => esc(n).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  return h.replace(re, m => {
    const t = S.d.equipos.find(e => esc(e.nombre) === m);
    return '<span class="eq" style="--c:' + esc(t ? t.color : '#eaf5f1') + '">' + m + '</span>';
  });
}
const plural = (n, s) => n === 1 ? s : s + 's';
function toast(msg, tipo) {
  const t = document.createElement('div');
  t.className = 'toast' + (tipo ? ' ' + tipo : ''); t.textContent = msg;
  const caja = $('#toasts'); caja.appendChild(t);
  while (caja.children.length > 2) caja.firstElementChild.remove();
  setTimeout(() => t.remove(), tipo === 'error' ? 7000 : 4200);
}
function ir(id) { const el = document.getElementById(id); if (el) { el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); return; } if (MULTIPAGINA && PAGINA_DE[id]) location.href = PAGINA_DE[id]; }

// ---------- Render ----------
function render() {
  const rolServidor = S.token && S.d.config && S.d.config.rol;
  if (rolServidor && rolServidor !== S.rol) { S.rol = rolServidor; almacen.set('rlo-rol', S.rol); }
  document.body.classList.toggle('es-admin', !!S.token);
  if (hay('#dominio')) renderDominio();
  if (hay('#notTitulo')) renderNoticia();
  renderMapa();
  if (hay('#gridTeams')) renderTeams();
  if (hay('#gridZonas')) renderAtlas();
  if (hay('#linea')) renderCronica();
  if (hay('#listaTorneos')) renderTorneos();
  renderEstado();
  $('#adminbar').hidden = !S.token;
  $('#adminbarTitulo').textContent = esEditor() ? 'Noticiero' : 'Administración';
  $$('#adminbar [data-solo-rol]').forEach(e => { e.hidden = (e.dataset.soloRol === 'editor') !== esEditor(); });
  if (hay('#clasif')) renderClasif();
  if (hay('#gridCarnets')) renderCarnets();
  renderGrupos();
  renderReglas();
  if (hay('#gridWiki')) renderWiki();
  if (hay('#wikiArticulo')) pintarWikiPagina();
  $$('.solo-admin').forEach(e => e.hidden = !esAdmin());
}

function renderDominio() {
  if (!hay('#dominio')) return; // en la web por páginas esta sección puede estar en otra página
  const z = S.d.territorios;
  if (!z.length) { $('#dominio').innerHTML = '<p class="cargando">' + (S.cargando ? 'Cargando la región…' : 'Todavía no hay zonas en el atlas.') + '</p>'; return; }
  const ctrl = z.filter(t => t.estado === 'Controlada'), disp = z.filter(t => t.estado === 'En disputa').length, muertos = z.filter(t => t.estado === 'Punto Muerto').length;
  const neutras = z.length - ctrl.length - disp - muertos, cuenta = {};
  ctrl.forEach(t => { cuenta[t.equipo] = (cuenta[t.equipo] || 0) + 1; });
  const ranking = Object.keys(cuenta).sort((a, b) => cuenta[b] - cuenta[a] || a.localeCompare(b));
  const barra = ranking.map(n => `<span style="--c:${esc(colorEq(n))};flex:${cuenta[n]}" title="${esc(n)}: ${cuenta[n]}"></span>`).join('')
    + (disp ? `<span style="--c:#ef5a5f;flex:${disp}" title="En disputa: ${disp}"></span>` : '')
    + (muertos ? `<span style="--c:#7d97a1;flex:${muertos}" title="Puntos muertos: ${muertos}"></span>` : '')
    + `<span class="neutral" style="flex:${neutras}" title="Neutrales: ${neutras}"></span>`;
  $('#dominio').innerHTML = `
    <div class="dom-cab"><span><b>${ctrl.length}</b>de ${z.length} zonas ${ctrl.length === 1 ? 'tiene' : 'tienen'} dueño</span></div>
    <div class="dom-barra" role="img" aria-label="${ctrl.length} zonas controladas, ${disp} en disputa, ${neutras} neutrales">${barra}</div>
    ${ranking.length ? `<ol class="dom-lista">${ranking.slice(0, 6).map(n => `<li style="--c:${esc(colorEq(n))}"><i></i><span>${esc(n)}</span><b>${cuenta[n]}</b></li>`).join('')}</ol>` : '<p class="muted" style="margin-top:12px">Todas las zonas están libres. El primer team que llegue puede reclamarlas.</p>'}
    <div class="dom-pie"><span>${neutras} ${neutras === 1 ? 'neutral' : 'neutrales'}</span><span>${disp} en disputa</span><span>${muertos} ${muertos === 1 ? 'punto muerto' : 'puntos muertos'}</span></div>`;
}

function renderNoticia() {
  if (!hay('#notTitulo')) return; // en la web por páginas esta sección puede estar en otra página
  const n = S.d.noticias[0];
  if (n && S.notId && n.id !== S.notId) S.tipeado = false;
  if (n) S.notId = n.id;
  const titulo = n ? n.titulo : (S.cargando ? 'Cargando…' : 'Sin novedades por ahora');
  const cuerpo = n ? n.cuerpo : (S.cargando ? '' : 'Cuando la Comisaría publique un parte, va a aparecer acá.');
  $('#notTitulo').textContent = titulo;
  $('#notFecha').innerHTML = n ? fecha(n.fecha) : '';
  const comp = $('#notCompartir');
  comp.hidden = !n;
  if (n) comp.href = 'https://wa.me/?text=' + encodeURIComponent('📰 Noticias Star: ' + n.titulo + '\n' + (SITIO_URL || location.href.split('#')[0]));
  const p = $('#notCuerpo');
  if (p.dataset.texto === cuerpo) return;
  p.dataset.texto = cuerpo;
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (S.tipeado || reducido || !cuerpo || S.cargando) { p.textContent = cuerpo; if (cuerpo && !S.cargando) S.tipeado = true; return; }
  S.tipeado = true; delete p.dataset.saltar;
  let i = 0; const total = Math.min(2400, cuerpo.length * 16), inicio = performance.now();
  p.textContent = '';
  const paso = ahora => {
    if (p.dataset.texto !== cuerpo) return;
    i = Math.min(cuerpo.length, Math.ceil((ahora - inicio) / total * cuerpo.length));
    p.textContent = cuerpo.slice(0, i);
    if (i < cuerpo.length && !p.dataset.saltar) requestAnimationFrame(paso); else p.textContent = cuerpo;
  };
  requestAnimationFrame(paso);
}

// Mapas por región: Región Star y La Jungla. Cada zona se marca sobre el mapa de su región.
const MAPAS_BASE = { jungla: 'https://stormacher95.github.io/mapas/la-jungla.png' };
const REG_TITULO = { star: 'la Región Star', jungla: 'La Jungla' };
function nombreRegion(rg) { const r = Core.REGIONES.find(x => x.id === rg); return r ? r.nombre : 'Región Star'; }
function mapaDe(rg) { const c = S.d.config || {}; return (c.mapas && c.mapas[rg]) || (rg === 'star' ? c.mapa : null) || null; }
/** Imágenes a probar en orden: la de Drive (enlace directo y miniatura), la copia embebida y el mapa base de la web. */
function fuentesMapa(rg) {
  const m = mapaDe(rg), f = m ? [m.url, m.alt].filter(Boolean) : [];
  if (m && m.id && MODO !== 'demo') f.push({ id: m.id });
  if (MAPAS_BASE[rg]) f.push(MAPAS_BASE[rg]);
  return f;
}
function regionVecina(dir) { const ids = Core.REGIONES.map(r => r.id), i = Math.max(0, ids.indexOf(S.region)); return ids[(i + dir + ids.length) % ids.length]; }
function cambiarRegion(rg) { if (!Core.region(rg) || rg === S.region) return; S.region = rg; renderMapa(); }
function zonasRegion(rg) { return S.d.territorios.filter(t => Core.regionDe(t) === rg); }
function renderMapa() {
  const rg = S.region, fuentes = fuentesMapa(rg), key = rg + '|' + fuentes.map(f => typeof f === 'string' ? f : 'id:' + f.id).join('|');
  $$('[data-escena]').forEach(esc_ => {
    const img = $('.mapa-img', esc_), vacioEl = $('.vacio-mapa', esc_), grande = esc_.classList.contains('grande');
    esc_.dataset.region = rg;
    if (img.dataset.k !== key || !img.getAttribute('src')) {
      const otraRegion = img.dataset.k && img.dataset.k.split('|')[0] !== rg;
      img.dataset.k = key; img.alt = 'Mapa territorial de ' + REG_TITULO[rg] + (grande ? ' ampliado' : ' con los emblemas de cada team');
      let i = 0;
      const sin = () => { img.hidden = true; vacioEl.hidden = false; img.removeAttribute('src'); img.classList.remove('llegando'); $('.pins', esc_).innerHTML = ''; };
      const prox = () => {
        if (img.dataset.k !== key) return;
        const f = fuentes[i++];
        if (f === undefined) return sin();
        if (typeof f === 'string') { img.src = f; return; }
        llamar('imagen', { id: f.id }).then(src => { if (img.dataset.k === key) img.src = src; }).catch(prox);
      };
      img.onerror = prox;
      img.onload = () => img.classList.remove('llegando');
      if (!fuentes.length) sin();
      else { if (otraRegion) img.classList.add('llegando'); img.hidden = false; vacioEl.hidden = true; prox(); }
    }
    const pins = zonasRegion(rg).filter(t => t.x !== '' && t.x != null && !isNaN(parseFloat(t.x)));
    $('.pins', esc_).innerHTML = img.hidden ? '' : pins.map(t => {
      const cl = t.estado === 'Controlada' ? '' : t.estado === 'En disputa' ? 'disputa' : t.estado === 'Punto Muerto' ? 'muerto' : 'neutral';
      const logo = (t.estado === 'Controlada' || t.estado === 'En disputa') && t.equipo ? emblema(t.equipo) : null;
      return `<button type="button" class="pin ${cl}${logo ? ' logo' : ''}" data-act="zona" data-id="${esc(t.id)}" style="left:${parseFloat(t.x)}%;top:${parseFloat(t.y)}%;--c:${esc(colorZona(t))}" aria-label="${esc(t.nombre)}: ${esc(t.estado === 'Controlada' ? t.equipo : t.estado + (t.equipo ? ' (' + t.equipo + ')' : ''))}">${logo ? imgEmblema(logo) : ''}<span class="pin-et">${esc(t.nombre)}</span></button>`;
    }).join('');
  });
  $$('[data-region-nombre]').forEach(e => { e.textContent = nombreRegion(rg); });
  $$('[data-region-titulo]').forEach(e => { e.textContent = 'Mapa de ' + REG_TITULO[rg]; });
  $$('.reg-puntos').forEach(e => { e.innerHTML = Core.REGIONES.map(r => `<i${r.id === rg ? ' class="on"' : ''}></i>`).join(''); });
  $$('.reg-flecha').forEach(b => { const d = regionVecina(+b.dataset.dir); b.setAttribute('aria-label', 'Ver el mapa de ' + REG_TITULO[d]); b.title = nombreRegion(d); });
  const zr = zonasRegion(rg), ubicadas = zr.filter(t => t.x !== '' && t.x != null).length, faltan = pendientesUbicar().length;
  let info = ubicadas ? esc(`${ubicadas} ${ubicadas === 1 ? 'zona marcada' : 'zonas marcadas'} en el mapa: cada emblema muestra qué team la controla y cambia solo al registrar una guerra.`)
    : !zr.length && rg !== 'star' ? esc(`Todavía no hay zonas cargadas en ${REG_TITULO[rg]}.`)
    : esc(puedeGuerra() ? 'Todavía no hay zonas marcadas en el mapa.' : 'Los emblemas muestran qué team controla cada parte de la región.');
  if (puedeGuerra() && faltan > 0) info += ` <button class="link" type="button" data-act="ubicar-pendientes">Ubicar zonas que faltan (${faltan})</button>`;
  if (esAdmin() && rg !== 'star') info += ` <button class="link" type="button" data-act="nueva-zona">Agregar zona de ${REG_TITULO[rg]}</button>`;
  // Un Codigo.gs viejo no guarda la región: avisar antes de que marquen zonas de La Jungla sobre la Star.
  if (puedeGuerra() && rg !== 'star' && MODO !== 'demo' && !(S.d.config && S.d.config.mapas)) info += ' <b>Para guardar zonas en este mapa hay que actualizar el Codigo.gs.</b>';
  if (hay('#pinsInfo')) $('#pinsInfo').innerHTML = info;
}

function renderTeams() {
  if (!hay('#gridTeams')) return; // en la web por páginas esta sección puede estar en otra página
  const zonas = {};
  S.d.territorios.forEach(t => { if (t.estado === 'Controlada') zonas[t.equipo] = (zonas[t.equipo] || 0) + 1; });
  $('#gridTeams').innerHTML = S.d.equipos.length ? S.d.equipos.map(e => { const m = Core.cantidad(e.miembros), lleno = m >= cupo(); return `
    <button type="button" class="team${lleno ? ' es-lleno' : ''}" data-act="team" data-id="${esc(e.id)}" style="--c:${esc(e.color || '#f4d38b')}" aria-label="${esc(e.nombre)}: ${m} de ${cupo()} miembros${lleno ? ', lleno' : ''}">
      ${(() => { const lg = emblema(e.nombre); return lg ? `<span class="team-emb con-logo" aria-hidden="true">${imgEmblema(lg)}</span>` : `<span class="team-emb" aria-hidden="true">${esc(e.emoji || '✦')}</span>`; })()}
      <span class="team-nom">${esc(e.nombre)}</span>
      <span class="team-tipo">${esc(e.tipo || 'Equipo comunitario')} · líder ${esc(e.lider && e.lider !== '—' ? e.lider : 'sin asignar')}</span>
      <span class="team-cupo"><span><b>${m}</b>/ ${cupo()} miembros</span>${lleno ? '<span class="lleno">Lleno</span>' : ''}</span>
      <span class="team-barra" aria-hidden="true"><i style="width:${Math.min(100, m / cupo() * 100)}%"></i></span>
      <span class="team-datos"><span><b>${zonas[e.nombre] || 0}</b>${plural(zonas[e.nombre] || 0, 'zona')}</span><span>Ver ficha</span></span>
    </button>`; }).join('') : `<p class="vacio">${S.cargando ? 'Cargando teams…' : 'No hay teams cargados.'}</p>`;
}

function renderAtlas() {
  if (!hay('#gridZonas')) return; // en la web por páginas esta sección puede estar en otra página
  const z = S.d.territorios, cuenta = { Todos: z.length };
  Core.ESTADOS.forEach(e => cuenta[e] = z.filter(t => t.estado === e).length);
  const nombres = { Todos: 'Todas', Controlada: 'Controladas', 'En disputa': 'En disputa', 'Punto Muerto': 'Puntos muertos', Neutral: 'Neutrales' };
  $('#filtros').innerHTML = ['Todos', 'Controlada', 'En disputa', 'Punto Muerto', 'Neutral'].map(k => `<button type="button" class="chip" data-act="filtro" data-f="${k}" aria-pressed="${S.filtro === k}">${nombres[k]}<b>${cuenta[k] || 0}</b></button>`).join('');
  const q = S.q.trim().toLocaleLowerCase('es');
  const orden = { Controlada: 0, 'En disputa': 1, 'Punto Muerto': 2, Neutral: 3 };
  const vis = z.filter(t => (S.filtro === 'Todos' || t.estado === S.filtro) && (!q || (t.nombre + ' ' + t.tipo + ' ' + t.equipo + ' ' + t.retador + ' ' + nombreRegion(Core.regionDe(t))).toLocaleLowerCase('es').includes(q)))
    .sort((a, b) => (orden[a.estado] - orden[b.estado]) || a.nombre.localeCompare(b.nombre, 'es'));
  $('#gridZonas').innerHTML = vis.map(t => `
    <button type="button" class="zona" data-act="zona" data-id="${esc(t.id)}" style="--c:${esc(colorZona(t))}">
      <span class="zona-nom">${esc(t.nombre)}</span><span class="zona-tipo">${esc(t.tipo)}${Core.regionDe(t) !== 'star' ? ' · ' + esc(nombreRegion(Core.regionDe(t))) : ''}</span>
      <span class="zona-est"><i></i>${esc(t.estado === 'Controlada' ? t.equipo : t.estado)}${t.x !== '' && t.x != null ? '<small>en el mapa</small>' : ''}</span>
    </button>`).join('');
  $('#zonasVacio').hidden = vis.length > 0 || S.cargando;
}

function renderCronica() {
  if (!hay('#linea')) return; // en la web por páginas esta sección puede estar en otra página
  const g = S.d.guerras;
  $('#linea').innerHTML = g.length ? g.slice(0, S.verGuerras).map(x => `
    <li style="--c:${esc(x.ganador ? colorEq(x.ganador) : '#93b9c3')}">
      <time>${fecha(x.fecha)}</time><p>${pintar(x.resumen)}</p>
      <div class="meta"><button class="link" type="button" data-act="zona" data-id="${esc(x.territorioId)}">${esc(x.territorio)}</button>${x.nota ? `<span>${esc(x.nota)}</span>` : ''}${puedeGuerra() ? `<button class="link" type="button" data-act="borrar-guerra" data-id="${esc(x.id)}" style="color:#ffb8ba">Borrar del historial</button>` : ''}</div>
    </li>`).join('') : `<li style="--c:#93b9c3"><p class="muted">${S.cargando ? 'Cargando…' : 'Todavía no hay partes de guerra.'}</p></li>`;
  $('#lineaMas').innerHTML = g.length > S.verGuerras ? `<button class="btn sm" type="button" data-act="mas-guerras">Ver ${Math.min(20, g.length - S.verGuerras)} partes más</button>` : '';
  $('#archivo').innerHTML = S.d.noticias.length ? S.d.noticias.map((n, i) => `
    <details class="nota"${i === 0 ? ' open' : ''}><summary><small>${fecha(n.fecha)}</small><b>${esc(n.titulo)}</b></summary><p>${pintar(n.cuerpo)}</p>
    ${puedeNoticias() ? `<div class="acc"><button class="btn sm" type="button" data-act="editar-noticia" data-id="${esc(n.id)}">Editar</button><button class="btn sm danger" type="button" data-act="borrar-noticia" data-id="${esc(n.id)}">Borrar</button></div>` : ''}</details>`).join('')
    : `<p class="vacio">${S.cargando ? 'Cargando…' : 'Sin noticias publicadas.'}</p>`;
}

function renderTorneos() {
  if (!hay('#listaTorneos')) return; // en la web por páginas esta sección puede estar en otra página
  $('#listaTorneos').innerHTML = S.d.torneos.length ? S.d.torneos.map(t => `
    <article class="torneo"><div class="torneo-f">${esc(t.fecha)}</div><div><h3>${esc(t.nombre)}</h3><p class="fmt">${esc(t.formato)}</p>${t.info ? `<p>${esc(t.info)}</p>` : ''}
      <div class="acc">${t.enlace ? `<a class="btn sm sand" href="${esc(t.enlace)}" target="_blank" rel="noopener">Inscribirme</a>` : ''}${esAdmin() ? `<button class="btn sm" type="button" data-act="editar-torneo" data-id="${esc(t.id)}">Editar</button><button class="btn sm danger" type="button" data-act="borrar-torneo" data-id="${esc(t.id)}">Quitar</button>` : ''}</div></div></article>`).join('')
    : `<p class="vacio">${S.cargando ? 'Cargando…' : 'Todavía no hay torneos publicados. Volvé pronto para conocer la próxima competencia.'}</p>`;
  $('#listaCombates').innerHTML = S.d.combates.length ? S.d.combates.slice(0, 12).map(c => `
    <li><span><b class="eq" style="--c:${esc(c.equipoGanador ? colorEq(c.equipoGanador) : '#eaf5f1')}">${esc(c.ganador)}</b> venció a <span class="eq" style="--c:${esc(c.equipoRival ? colorEq(c.equipoRival) : '#c3dbe0')}">${esc(c.rival)}</span></span>
    ${esAdmin() ? `<button class="link" type="button" data-act="borrar-combate" data-id="${esc(c.id)}" style="color:#ffb8ba">Borrar</button>` : '<span></span>'}
    <small>${esc(c.formato)} · ${fecha(c.fecha, false)}${c.nota ? ' · ' + esc(c.nota) : ''}</small></li>`).join('')
    : `<li><small>Todavía no hay combates registrados.</small></li>`;
}

function renderClasif() {
  if (!hay('#clasif')) return; // en la web por páginas esta sección puede estar en otra página
  const gana = ['conquista', 'toma', 'defensa', 'resguardo'];
  const filas = S.d.equipos.map(e => ({
    e, zonas: S.d.territorios.filter(t => t.estado === 'Controlada' && t.equipo === e.nombre).length,
    vict: S.d.guerras.filter(g => g.ganador === e.nombre && gana.indexOf(g.accion) >= 0).length,
    comb: S.d.combates.filter(c => c.equipoGanador === e.nombre).length
  })).sort((a, b) => b.zonas - a.zonas || b.vict - a.vict || b.comb - a.comb || a.e.nombre.localeCompare(b.e.nombre, 'es'));
  $('#clasif').innerHTML = filas.length ? filas.map((f, i) => `<tr><td class="n">${i + 1}</td><td><button class="link eq" type="button" data-act="team" data-id="${esc(f.e.id)}" style="--c:${esc(f.e.color)};text-decoration:none">${esc(f.e.emoji || '')} ${esc(f.e.nombre)}</button></td><td class="num">${f.zonas}</td><td class="num">${f.vict}</td><td class="num">${f.comb}</td></tr>`).join('')
    : `<tr><td colspan="5" class="muted">${S.cargando ? 'Cargando…' : 'Sin teams cargados.'}</td></tr>`;
}

function renderEstado() {
  const e = $('#estado');
  e.classList.toggle('demo-e', MODO === 'demo');
  const hora = S.d.config && S.d.config.ahora ? new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' }).format(new Date(S.d.config.ahora)) : '';
  e.lastElementChild.textContent = MODO === 'demo' ? 'Demostración con datos locales' : (S.cargando ? 'Conectando…' : 'En vivo' + (hora ? ' · actualizado ' + hora : ''));
  $('#avisoDemo').hidden = MODO !== 'demo';
}

// ---------- Diálogos ----------
function abrir(d) { if (!d.open) d.showModal(); }
function cerrar(d) { if (d.open) d.close(); }
function campo(c, pre = 'f') {
  const id = pre + '-' + c.n, req = c.req ? ' required' : '', max = c.max ? ` maxlength="${c.max}"` : '';
  let ctrl;
  if (c.t === 'select') ctrl = `<select id="${id}" name="${c.n}"${req}>${c.opc.map(o => { const v = typeof o === 'string' ? o : o.v, l = typeof o === 'string' ? o : o.l; return `<option value="${esc(v)}"${String(v) === String(c.v ?? '') ? ' selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
  else if (c.t === 'textarea') ctrl = `<textarea id="${id}" name="${c.n}"${req}${max} placeholder="${esc(c.ph || '')}">${esc(c.v || '')}</textarea>`;
  else ctrl = `<input id="${id}" name="${c.n}" type="${c.t || 'text'}"${req}${max} value="${esc(c.v || '')}" placeholder="${esc(c.ph || '')}"${c.t === 'file' ? ' accept="image/png,image/jpeg,image/webp,image/gif"' : ''}${c.t === 'password' ? ' autocomplete="current-password"' : ''}>`;
  return `<label class="campo" for="${id}"${c.ancho ? ' style="grid-column:1/-1"' : ''}>${esc(c.l)}${ctrl}${c.ayuda ? `<small>${esc(c.ayuda)}</small>` : ''}</label>`;
}
/** Formulario genérico: se queda abierto si enviar() falla y muestra el error. */
function formulario({ titulo, texto, campos = [], boton = 'Guardar', peligro = false, dos = false, enviar }) {
  const d = $('#dlgForm');
  d.innerHTML = `<form class="dlg" novalidate><div class="dlg-cab"><h2>${esc(titulo)}</h2><button class="x" type="button" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="dlg-cuerpo">${texto ? `<p class="muted">${esc(texto)}</p>` : ''}${campos.length ? `<div class="campos${dos ? ' dos' : ''}">${campos.map(c => campo(c)).join('')}</div>` : ''}
    <p class="form-error" role="alert"></p><div class="dlg-acc"><button class="btn" type="button" data-cerrar>Cancelar</button><button class="btn ${peligro ? 'danger' : 'sand'}" type="submit">${esc(boton)}</button></div></div></form>`;
  const f = $('form', d), err = $('.form-error', d), b = $('[type=submit]', d);
  f.onsubmit = async ev => {
    ev.preventDefault(); err.textContent = '';
    const falta = campos.find(c => c.req && !String(f.elements[c.n].value || '').trim());
    if (falta) { err.textContent = 'Completá “' + falta.l + '”.'; f.elements[falta.n].focus(); return; }
    const vals = {}; campos.forEach(c => { vals[c.n] = c.t === 'file' ? f.elements[c.n].files[0] : f.elements[c.n].value; });
    const txt = b.textContent; b.disabled = true; b.textContent = 'Guardando…';
    try { await enviar(vals); if (f.isConnected) cerrar(d); }
    catch (e) { err.textContent = e.message; }
    finally { b.disabled = false; b.textContent = txt; }
  };
  abrir(d);
  const primero = $('input,select,textarea', d); if (primero) setTimeout(() => primero.focus(), 30);
}
const confirmar = (titulo, texto, boton, enviar) => formulario({ titulo, texto, boton, peligro: true, enviar });

function fichaTeam(id) {
  const e = S.d.equipos.find(x => x.id === id); if (!e) return;
  const zonas = S.d.territorios.filter(t => t.estado === 'Controlada' && t.equipo === e.nombre);
  const m = Core.cantidad(e.miembros), lleno = m >= cupo();
  const carnetsTeam = (S.carnets || []).filter(c => c.equipo === e.nombre);
  const d = $('#dlgTeam');
  d.innerHTML = `<div class="dlg" style="--c:${esc(e.color)}"><div class="dlg-cab">${(() => { const lg = emblema(e.nombre); return lg ? `<span class="emb-ficha" aria-hidden="true">${imgEmblema(lg)}</span>` : `<span style="font-size:34px" aria-hidden="true">${esc(e.emoji || '✦')}</span>`; })()}<h2>${esc(e.nombre)}</h2><p class="muted">${esc(e.tipo || 'Equipo comunitario')}</p><button class="x" type="button" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="dlg-cuerpo">
      <p class="lore">${esc(e.lore || 'Este team está escribiendo su historia en la comunidad.')}</p>
      ${lleno ? `<p class="aviso-lleno">${esc(e.nombre)} está lleno: completó su cupo de ${cupo()} miembros. Consultá en el grupo general si se libera un lugar o mirá otros teams.</p>` : `<p class="muted">Para sumarte a ${esc(e.nombre)}, escribile al líder o a un admin en el grupo general de WhatsApp. Quedan ${cupo() - m} ${cupo() - m === 1 ? 'lugar' : 'lugares'}.</p>`}
      <dl class="ficha"><div><dt>Líder</dt><dd>${esc(e.lider && e.lider !== '—' ? e.lider : 'Sin asignar')}</dd></div><div><dt>Miembros</dt><dd>${esAdmin() ? `<small class="mm-estado" data-mm-estado="${esc(e.id)}">${textoCupo(m)}</small>${controlMiembros(e)}` : m + ' de ' + cupo() + (lleno ? ' · Lleno' : '')}</dd></div><div><dt>Zonas controladas</dt><dd>${zonas.length}</dd></div></dl>
      ${carnetsTeam.length ? `<div><h3 style="font-size:18px;margin-bottom:8px">Entrenadores con carnet</h3><div class="zchips">${carnetsTeam.map(c => `<button type="button" data-act="carnet" data-id="${esc(c.id)}" style="--c:${esc(e.color)}">${esc(c.nombre)}</button>`).join('')}</div></div>` : ''}
      ${zonas.length ? `<div><h3 style="font-size:18px;margin-bottom:8px">Territorio</h3><div class="zchips">${zonas.map(z => `<button type="button" data-act="zona" data-id="${esc(z.id)}" style="--c:${esc(e.color)}">${esc(z.nombre)}</button>`).join('')}</div></div>` : ''}
      <div class="dlg-acc">${esAdmin() ? `<button class="btn danger" type="button" data-act="borrar-team" data-id="${esc(e.id)}">Quitar team</button><button class="btn" type="button" data-act="editar-team" data-id="${esc(e.id)}">Editar</button>` : ''}${lleno ? `<a class="btn" href="${WPP_GENERAL}" target="_blank" rel="noopener">Consultar en el grupo general</a>` : `<a class="btn sand" href="${WPP_GENERAL}" target="_blank" rel="noopener">Pedir ingreso por WhatsApp</a>`}</div>
    </div></div>`;
  abrir(d);
}

function fichaZona(id) {
  const t = S.d.territorios.find(x => x.id === id); if (!t) return;
  const hist = S.d.guerras.filter(g => g.territorioId === t.id), c = colorZona(t), adm = puedeGuerra();
  const opcEq = [{ v: '', l: 'Elegí un team…' }].concat(S.d.equipos.map(e => ({ v: e.nombre, l: e.nombre })));
  const opcRiv = [{ v: '', l: 'Sin rival / zona libre' }].concat(S.d.equipos.map(e => ({ v: e.nombre, l: e.nombre })));
  const enMapa = t.x !== '' && t.x != null;
  const d = $('#dlgZona');
  d.innerHTML = `<div class="dlg" style="--c:${esc(c)}"><div class="dlg-cab"><p class="muted">${esc(t.tipo)} · ${esc(nombreRegion(Core.regionDe(t)))}</p><h2>${esc(t.nombre)}</h2><p style="margin-top:10px"><span class="pill" style="--c:${esc(c)}">${esc(t.estado === 'Controlada' ? 'Controlada por ' + t.equipo : t.estado)}</span></p><button class="x" type="button" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="dlg-cuerpo">
      <dl class="ficha"><div><dt>Último parte</dt><dd>${pintar(t.ultimo || 'Zona neutral')}</dd></div>${t.retador ? `<div><dt>Retador</dt><dd>${pintar(t.retador)}</dd></div>` : ''}<div><dt>Referencia en el mapa</dt><dd>${esc(t.referencia || 'Por confirmar')}</dd></div></dl>
      <div class="dlg-acc" style="justify-content:flex-start">${enMapa ? `<button class="btn sm" type="button" data-act="ver-en-mapa" data-id="${esc(t.id)}">Ver en el mapa</button>` : ''}<button class="btn sm sand" type="button" data-act="wiki" data-zona="${esc(t.nombre)}">Guía de la zona</button></div>
      <div><h3 style="font-size:18px;margin-bottom:8px">Historial de guerras</h3>${hist.length ? `<ol class="hist">${hist.slice(0, 25).map(g => `<li style="--c:${esc(g.ganador ? colorEq(g.ganador) : '#93b9c3')}"><time>${fecha(g.fecha)}</time>${pintar(g.resumen)}${g.nota ? `<br><small class="muted">${esc(g.nota)}</small>` : ''}</li>`).join('')}</ol>` : '<p class="muted">Sin batallas registradas en esta zona.</p>'}</div>
      ${adm ? `<form class="caja-admin" id="formGuerra"><h3>Registrar resultado</h3>
        <div class="campos dos">
          ${campo({ n: 'accion', l: 'Qué pasó', t: 'select', ancho: true, opc: [{ v: 'conquista', l: 'Conquista: venció al team que la tenía' }, { v: 'toma', l: 'Tomó la zona libre' }, { v: 'defensa', l: 'Defendió y ganó' }, { v: 'disputa', l: 'Quedó en disputa' }, { v: 'resguardo', l: 'Resguardo del Escuadrón Élite' }, { v: 'liberacion', l: 'Liberada / neutral' }, { v: 'muerto', l: 'Marcar como Punto Muerto' }] }, 'z')}
          ${campo({ n: 'ganador', l: 'Team ganador', t: 'select', opc: opcEq }, 'z')}
          ${campo({ n: 'perdedor', l: 'Team derrotado o rival', t: 'select', opc: opcRiv }, 'z')}
          ${campo({ n: 'nota', l: 'Nota (opcional)', ph: 'Ej.: captura compartida en el grupo', max: 200, ancho: true }, 'z')}
          ${campo({ n: 'referencia', l: 'Referencia en el mapa', v: t.referencia, ph: 'Ej.: costa sur, junto a la Ruta 10', max: 120, ancho: true }, 'z')}
        </div><p class="form-error" role="alert"></p>
        <div class="dlg-acc"><button class="btn sand" type="submit">Guardar resultado</button></div></form>
        <div class="dlg-acc" style="justify-content:flex-start"><button class="btn sm" type="button" data-act="ubicar" data-id="${esc(t.id)}">${enMapa ? 'Mover en el mapa' : 'Ubicar en el mapa'}</button>${enMapa ? `<button class="btn sm" type="button" data-act="desubicar" data-id="${esc(t.id)}">Quitar del mapa</button>` : ''}<button class="btn sm" type="button" data-act="editar-zona" data-id="${esc(t.id)}">Editar zona</button>${esAdmin() ? `<button class="btn sm danger" type="button" data-act="borrar-zona" data-id="${esc(t.id)}">Borrar zona</button>` : ''}</div>` : ''}
    </div></div>`;
  const f = $('#formGuerra', d);
  if (f) f.onsubmit = async ev => {
    ev.preventDefault();
    const b = $('[type=submit]', f), err = $('.form-error', f);
    const p = { territorio: t.id, accion: f.elements.accion.value, ganador: f.elements.ganador.value, perdedor: f.elements.perdedor.value, nota: f.elements.nota.value, referencia: f.elements.referencia.value };
    b.disabled = true; b.textContent = 'Guardando…'; err.textContent = '';
    try { await accion('guerraRegistrar', p, 'Resultado guardado en ' + t.nombre); fichaZona(t.id); }
    catch (e) { err.textContent = e.message; b.disabled = false; b.textContent = 'Guardar resultado'; }
  };
  abrir(d);
}

function formTeam(e) {
  e = e || {};
  formulario({
    titulo: e.id ? 'Editar ' + e.nombre : 'Nuevo team', boton: e.id ? 'Guardar cambios' : 'Crear team', dos: true,
    campos: [
      { n: 'nombre', l: 'Nombre', v: e.nombre, req: true, max: 40 }, { n: 'emoji', l: 'Símbolo (emoji)', v: e.emoji || '✦', max: 8 },
      { n: 'lider', l: 'Líder', v: e.lider === '—' ? '' : e.lider, max: 40 }, { n: 'tipo', l: 'Tipo', v: e.tipo || 'Escuadrón', max: 30 },
      { n: 'color', l: 'Color', t: 'color', v: e.color || '#f4d38b' }, { n: 'miembros', l: 'Miembros (cupo ' + cupo() + ')', t: 'number', v: String(Core.cantidad(e.miembros)) },
      { n: 'lore', l: 'Lore breve, sin spoilers', t: 'textarea', v: e.lore, max: 600, ancho: true }
    ],
    enviar: async v => { await accion('equipoGuardar', Object.assign({ id: e.id || '' }, v), e.id ? 'Team actualizado' : 'Team creado'); if (e.id) fichaTeam(e.id); }
  });
}

function formZona(t) {
  t = t || {};
  formulario({
    titulo: t.id ? 'Editar ' + t.nombre : 'Nueva zona', texto: t.id ? '' : 'La zona entra como neutral. Después podés ubicarla en el mapa y registrar resultados.', boton: t.id ? 'Guardar cambios' : 'Agregar al atlas',
    campos: [{ n: 'nombre', l: 'Nombre de la ciudad, isla o zona', v: t.nombre, req: true, max: 60 }, { n: 'tipo', l: 'Tipo de lugar', v: t.tipo, ph: 'Ciudad, ruta, isla, cueva…', max: 30 }, { n: 'referencia', l: 'Referencia en el mapa', v: t.referencia, ph: 'Ej.: norte, costa sur', max: 120 },
      { n: 'region', l: 'Región', t: 'select', v: t.id ? Core.regionDe(t) : S.region, opc: Core.REGIONES.map(r => ({ v: r.id, l: r.nombre })), ayuda: t.id && t.x !== '' && t.x != null ? 'Si la cambiás, la zona sale de este mapa y la ubicás de nuevo en el de la otra región.' : '' }],
    enviar: async v => { const r = await llamar('zonaGuardar', Object.assign({ id: t.id || '' }, v)); if (r && r.equipos) S.d = r; S.region = Core.region(v.region) || S.region; render(); toast(t.id ? 'Zona actualizada' : 'Zona agregada al atlas'); fichaZona(t.id || (S.d.territorios.find(x => x.nombre === Core.txt(v.nombre, 60)) || {}).id); }
  });
}

const ACCIONES_ZONA = [{ v: 'conquista', l: 'Conquista: venció al team que la tenía' }, { v: 'toma', l: 'Tomó la zona libre' }, { v: 'defensa', l: 'Defendió y ganó' }, { v: 'disputa', l: 'Quedó en disputa' }, { v: 'resguardo', l: 'Resguardo del Escuadrón Élite' }, { v: 'liberacion', l: 'Liberada / neutral' }, { v: 'muerto', l: 'Marcar como Punto Muerto' }];
function titularZona(z, ac, g) {
  if (!z) return '';
  return ({ conquista: g ? g + ' conquista ' + z : '', toma: g ? g + ' toma ' + z : '', defensa: g ? g + ' defiende ' + z : '', resguardo: g ? g + ' resguarda ' + z : '', disputa: 'Disputa abierta en ' + z, liberacion: z + ' queda liberada', muerto: z + ' queda como Punto Muerto' })[ac] || '';
}
function formNoticia(n) {
  n = n || {};
  const nueva = !n.id;
  const zonas = S.d.territorios.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const eqs = S.d.equipos.map(e => ({ v: e.nombre, l: e.nombre }));
  const campos = [{ n: 'titulo', l: 'Titular', v: n.titulo, req: true, max: 90, ancho: true }, { n: 'cuerpo', l: 'Parte', t: 'textarea', v: n.cuerpo, max: 900, ancho: true, ph: 'Qué pasó, quién está involucrado, qué recomienda la Comisaría…' }];
  if (nueva && zonas.length) campos.push(
    { n: 'zona', l: 'Zona afectada (opcional)', t: 'select', ancho: true, ayuda: 'Si la noticia cambia quién tiene una zona, elegila: el atlas, el mapa y la crónica se actualizan junto con la noticia.', opc: [{ v: '', l: 'Ninguna: solo publicar la noticia' }].concat(zonas.map(z => ({ v: z.id, l: z.nombre + ' · ' + (z.estado === 'Controlada' ? z.equipo : z.estado) }))) },
    { n: 'accion', l: 'Qué pasó en la zona', t: 'select', ancho: true, opc: ACCIONES_ZONA },
    { n: 'ganador', l: 'Team ganador', t: 'select', opc: [{ v: '', l: 'Elegí un team…' }].concat(eqs) },
    { n: 'perdedor', l: 'Team derrotado o rival', t: 'select', opc: [{ v: '', l: 'Sin rival / zona libre' }].concat(eqs) }
  );
  formulario({
    titulo: n.id ? 'Editar noticia' : 'Publicar en Noticias Star', texto: n.id ? '' : 'La última noticia aparece arriba de todo, en el cuadro de diálogo del mapa.', boton: n.id ? 'Guardar cambios' : 'Publicar', dos: true,
    campos,
    enviar: async v => {
      const p = { id: n.id || '', titulo: v.titulo, cuerpo: v.cuerpo };
      if (v.zona) {
        if (['conquista', 'toma', 'defensa', 'resguardo'].includes(v.accion) && !v.ganador) throw new Error('Elegí el team que ganó o tomó la zona.');
        if (v.ganador && v.ganador === v.perdedor) throw new Error('El ganador y el rival no pueden ser el mismo team.');
        p.zona = { territorio: v.zona, accion: v.accion, ganador: v.ganador, perdedor: v.perdedor, nota: Core.txt('Noticia: ' + v.titulo, 200) };
      }
      const z = v.zona && S.d.territorios.find(x => x.id === v.zona);
      await accion('noticiaGuardar', p, n.id ? 'Noticia actualizada' : z ? 'Noticia publicada y ' + z.nombre + ' actualizada' : 'Noticia publicada');
      S.tipeado = false; if (hay('#notCuerpo')) $('#notCuerpo').dataset.texto = ''; renderNoticia();
    }
  });
  const f = $('#dlgForm form'); if (!f || !f.elements.zona) return;
  const filas = ['accion', 'ganador', 'perdedor'].map(k => f.elements[k].closest('label'));
  const tit = f.elements.titulo; let auto = '';
  const sync = () => {
    const z = S.d.territorios.find(x => x.id === f.elements.zona.value);
    filas.forEach(l => { l.hidden = !z; });
    const sugerido = z ? titularZona(z.nombre, f.elements.accion.value, f.elements.ganador.value) : '';
    if (!tit.value.trim() || tit.value === auto) { tit.value = sugerido; auto = sugerido; }
  };
  ['zona', 'accion', 'ganador'].forEach(k => f.elements[k].addEventListener('change', sync));
  sync();
}

function formTorneo(t) {
  t = t || {};
  formulario({
    titulo: t.id ? 'Editar torneo' : 'Nuevo torneo', boton: t.id ? 'Guardar cambios' : 'Publicar torneo', dos: true,
    campos: [{ n: 'nombre', l: 'Nombre del torneo', v: t.nombre, req: true, max: 80, ancho: true }, { n: 'fecha', l: 'Fecha y hora', v: t.fecha, ph: 'Sáb 14 nov · 20 h (ARG)', max: 60 }, { n: 'formato', l: 'Formato', v: t.formato, ph: 'Individual 6v6, nivel 50', max: 60 },
      { n: 'info', l: 'Inscripción e información', t: 'textarea', v: t.info, max: 500, ancho: true }, { n: 'enlace', l: 'Enlace de inscripción (opcional)', t: 'url', v: t.enlace, ph: 'https://…', ancho: true }],
    enviar: v => accion('torneoGuardar', Object.assign({ id: t.id || '' }, v), t.id ? 'Torneo actualizado' : 'Torneo publicado')
  });
}

function formCombate() {
  const opc = [{ v: '', l: 'Sin team' }].concat(S.d.equipos.map(e => ({ v: e.nombre, l: e.nombre })));
  formulario({
    titulo: 'Registrar combate', boton: 'Registrar', dos: true,
    campos: [{ n: 'ganador', l: 'Ganador', req: true, max: 40 }, { n: 'equipoGanador', l: 'Team del ganador', t: 'select', opc }, { n: 'rival', l: 'Rival', req: true, max: 40 }, { n: 'equipoRival', l: 'Team del rival', t: 'select', opc },
      { n: 'formato', l: 'Formato', ph: 'Amistoso, duelo entre teams…', max: 50 }, { n: 'nota', l: 'Nota (opcional)', max: 160 }],
    enviar: v => accion('combateGuardar', v, 'Combate registrado')
  });
}

function leerArchivo(file) {
  return new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = () => ko(new Error('No pude leer el archivo.')); r.readAsDataURL(file); });
}

// ---------- Carnets de entrenador ----------
const COLOR_TIPO = { Normal: '#a8a77a', Fuego: '#ee8130', Agua: '#6390f0', Planta: '#7ac74c', 'Eléctrico': '#f7d02c', Hielo: '#96d9d6', Lucha: '#c22e28', Veneno: '#a33ea1', Tierra: '#e2bf65', Volador: '#a98ff3', 'Psíquico': '#f95587', Bicho: '#a6b91a', Roca: '#b6a136', Fantasma: '#735797', 'Dragón': '#6f35fc', Siniestro: '#705746', Acero: '#b7b7ce', Hada: '#d685ad' };
const TIPO_CLARO = ['Normal', 'Eléctrico', 'Hielo', 'Tierra', 'Bicho', 'Roca', 'Acero', 'Planta', 'Hada', 'Volador'];
const tipoChip = t => t ? `<span class="tipo" style="--tc:${COLOR_TIPO[t] || '#3d9ab8'};--tt:${TIPO_CLARO.indexOf(t) >= 0 ? '#1d2327' : '#fff'}">${esc(t)}</span>` : '';
const numCarnet = n => 'N.º ' + String(n || 0).padStart(4, '0');
const DEX_URL = 'https://stormacher95.github.io/pokedex.json';
// Emblemas de los teams (pertenecen a sus dueños; se usan solo para identificar a cada team en el mapa).
const EMBLEMAS_URL = 'https://stormacher95.github.io/emblemas/';
const EMBLEMAS = [[/rocket/, 'rocket'], [/magma/, 'magma'], [/aqua/, 'aqua'], [/galax|galactic/, 'galaxia'], [/plasma/, 'plasma'], [/flare/, 'flare'], [/skull/, 'skull'], [/re[qk]u?iem|rekiem/, 'rekiem'], [/elite/, 'elite'], [/delta/, 'delta']];
function emblema(nombre) {
  const n = String(nombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const e = EMBLEMAS.find(([re]) => re.test(n));
  return e ? { url: EMBLEMAS_URL + e[1] + '.png', cubre: e[1] === 'delta' } : null;
}
const imgEmblema = lg => `<img src="${esc(lg.url)}" alt=""${lg.cubre ? ' class="cubre"' : ''} loading="lazy" decoding="async" onerror="this.remove()">`;
const MI = {
  get() { try { return JSON.parse(localStorage.getItem('rlo-mi-carnet') || 'null'); } catch (e) { return null; } },
  set(v) { try { localStorage.setItem('rlo-mi-carnet', JSON.stringify(v)); } catch (e) { } },
  borrar() { try { localStorage.removeItem('rlo-mi-carnet'); } catch (e) { } }
};
S.carnets = null; S.qc = ''; S.fc = ''; S.pvp = false; S.dex = null;

/** Avatar pixelado único, generado a partir del nombre. */
function avatar(nombre, color, tam) {
  let h = 2166136261;
  for (const ch of String(nombre).toLowerCase()) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  let r = '';
  for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) {
    h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
    if (((h ^ (h >>> 16)) >>> 0) % 5 < 3) { r += `<rect x="${x}" y="${y}" width="1" height="1"/>`; if (x < 2) r += `<rect x="${4 - x}" y="${y}" width="1" height="1"/>`; }
  }
  return `<svg class="avatar" viewBox="-1 -1 7 7" width="${tam}" height="${tam}" shape-rendering="crispEdges" aria-hidden="true"><rect x="-1" y="-1" width="7" height="7" rx="1.2" fill="#041d28"/><g fill="${esc(color)}">${r}</g></svg>`;
}

async function cargarCarnets() {
  try {
    S.carnets = await llamar('entrenadores');
    if (MODO !== 'demo') try { localStorage.setItem('rlo-carnets-v1', JSON.stringify(S.carnets)); } catch (e) { }
  } catch (e) { if (!S.carnets) S.carnets = []; }
  renderCarnets();
}

function renderCarnets() {
  if (!hay('#gridCarnets')) return; // en la web por páginas esta sección puede estar en otra página
  const sel = $('#filtroCarnet');
  sel.innerHTML = '<option value="">Todos los teams</option><option value="-">Sin team</option>' + S.d.equipos.map(e => `<option>${esc(e.nombre)}</option>`).join('');
  sel.value = S.fc;
  const lista = S.carnets || [], mi = MI.get(), mio = mi && lista.find(c => c.id === mi.id);
  $('#miCarnet').innerHTML = mio ? `<div class="mi-carnet">${avatar(mio.nombre, mio.equipo ? colorEq(mio.equipo) : '#93b9c3', 34)}<span>Tu carnet: <b>${esc(mio.nombre)}</b> · ${numCarnet(mio.numero)}</span><span class="acc"><button class="btn sm" type="button" data-act="carnet" data-id="${esc(mio.id)}">Ver</button></span></div>` : '';
  const q = S.qc.trim().toLocaleLowerCase('es');
  const vis = lista.filter(c => (!S.fc || (S.fc === '-' ? !c.equipo : c.equipo === S.fc)) && (!S.pvp || c.pvp) &&
    (!q || (c.nombre + ' ' + c.poke.map(x => x.e + ' ' + (x.a || '')).join(' ')).toLocaleLowerCase('es').includes(q)));
  $('#gridCarnets').innerHTML = S.carnets === null ? '<p class="cargando">Cargando carnets…</p>' : vis.map(miniCarnet).join('');
  const vacio = $('#carnetsVacio');
  vacio.hidden = S.carnets === null || vis.length > 0;
  vacio.innerHTML = lista.length ? 'Ningún carnet coincide con la búsqueda.' : 'Todavía no hay carnets. <button class="link" type="button" data-act="carnet-nuevo">Creá el primero</button>.';
}

function miniCarnet(c) {
  const col = c.equipo ? colorEq(c.equipo) : '#93b9c3';
  const slots = Array.from({ length: 6 }, (_, i) => { const x = c.poke[i]; return x ? `<span class="mini-poke" style="--tc:${COLOR_TIPO[x.t] || '#3d9ab8'}" title="${esc(x.e)}">${esc(x.a || x.e)}${x.s ? ' ✨' : ''}</span>` : '<span class="mini-poke vacio-slot"></span>'; }).join('');
  return `<button type="button" class="carnet-mini" data-act="carnet" data-id="${esc(c.id)}" style="--c:${esc(col)}">
    <span class="cm-cab">${avatar(c.nombre, col, 46)}<span class="cm-txt"><b>${esc(c.nombre)}</b><small>${numCarnet(c.numero)} · ${esc(c.equipo || 'Sin team')}</small></span>${c.pvp ? '<span class="cm-ico" title="Acepta desafíos">⚔</span>' : ''}</span>
    <span class="cm-poke">${slots}</span></button>`;
}

function pokeHTML(x) {
  if (!x) return '<article class="poke libre"><span>Espacio libre</span></article>';
  const c1 = COLOR_TIPO[x.tipo1] || '#3d9ab8', c2 = COLOR_TIPO[x.tipo2] || c1;
  return `<article class="poke" style="--t1:${c1};--t2:${c2}">
    <header><div><b>${esc(x.apodo || x.especie)}${x.shiny ? ' <span class="shiny" title="Shiny">✨</span>' : ''}</b>${x.apodo ? `<small>${esc(x.especie)}</small>` : ''}</div>${x.nivel ? `<span class="nv">Nv. ${esc(x.nivel)}</span>` : ''}</header>
    ${x.tipo1 ? `<div class="tipos">${tipoChip(x.tipo1)}${tipoChip(x.tipo2)}</div>` : ''}
    <dl class="poke-dl"><div><dt>Habilidad</dt><dd>${esc(x.habilidad || '—')}</dd></div><div><dt>Objeto</dt><dd>${esc(x.objeto || '—')}</dd></div></dl>
    ${x.movimientos && x.movimientos.length ? `<ul class="movs">${x.movimientos.map(m => `<li title="${esc(m)}">${esc(m)}</li>`).join('')}</ul>` : ''}
  </article>`;
}

function enlaceCarnet(c) { return (MULTIPAGINA ? SITIO_URL + 'carnets.html' : (SITIO_URL || location.href.split('#')[0])) + '#carnet/' + c.id; }

function carnetHTML(c) {
  const col = c.equipo ? colorEq(c.equipo) : '#93b9c3', adm = esAdmin();
  const desde = c.creado && !isNaN(new Date(c.creado)) ? new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(new Date(c.creado)) : '';
  const url = enlaceCarnet(c);
  const wa = 'https://wa.me/?text=' + encodeURIComponent('🎴 Carnet de entrenador de ' + c.nombre + ' (' + numCarnet(c.numero) + ')\n' + url);
  return `<div class="dlg carnet" style="--c:${esc(col)}">
    <div class="carnet-cab"><div class="carnet-id">${avatar(c.nombre, col, 84)}<div>
      <p class="carnet-sup">Carnet de entrenador · Región Star</p><h2>${esc(c.nombre)}</h2>
      <p class="carnet-meta"><span class="carnet-num">${numCarnet(c.numero)}</span><span class="pill" style="--c:${esc(col)}">${esc(c.equipo || 'Sin team')}</span>${c.pvp ? '<span class="pill" style="--c:#f4d38b">⚔ Acepta desafíos</span>' : ''}</p>
    </div></div><button class="x" type="button" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="dlg-cuerpo">
      ${c.lema ? `<p class="carnet-lema">“${esc(c.lema)}”</p>` : ''}
      <dl class="ficha">${c.usuario ? `<div><dt>Usuario en Reloaded Online</dt><dd>${esc(c.usuario)}</dd></div>` : ''}${desde ? `<div><dt>Entrenador desde</dt><dd>${esc(desde)}</dd></div>` : ''}<div><dt>Equipo</dt><dd>${c.pokemon.length} de 6 Pokémon</dd></div></dl>
      <div class="equipo-poke">${Array.from({ length: 6 }, (_, i) => pokeHTML(c.pokemon[i])).join('')}</div>
      <div class="dlg-acc">
        ${adm ? `<button class="btn sm danger" type="button" data-act="carnet-borrar" data-id="${esc(c.id)}">Borrar carnet</button><button class="btn sm" type="button" data-act="carnet-clave" data-id="${esc(c.id)}">Clave nueva</button>` : ''}
        <button class="btn sm" type="button" data-act="copiar" data-url="${esc(url)}">Copiar enlace</button>
        <a class="btn sm" href="${esc(wa)}" target="_blank" rel="noopener">Compartir</a>
        <button class="btn sm sand" type="button" data-act="carnet-editar" data-id="${esc(c.id)}">Editar</button>
      </div>
    </div></div>`;
}

async function abrirCarnet(id) {
  const d = $('#dlgCarnet');
  d.innerHTML = '<div class="dlg"><div class="dlg-cuerpo"><p class="cargando">Abriendo carnet…</p></div></div>';
  abrir(d);
  try {
    const c = await llamar('carnet', { id });
    S.carnetAbierto = c; d.innerHTML = carnetHTML(c);
    if (location.hash !== '#carnet/' + id) history.replaceState(null, '', '#carnet/' + id);
  } catch (e) {
    d.innerHTML = `<div class="dlg"><div class="dlg-cab"><h2>Carnet no encontrado</h2><button class="x" type="button" data-cerrar aria-label="Cerrar">✕</button></div><div class="dlg-cuerpo"><p class="muted">${esc(e.message)}</p></div></div>`;
  }
}

async function cargarDex() {
  if (S.dex) return S.dex;
  for (const u of [MULTIPAGINA ? '/pokedex.json' : 'pokedex.json', DEX_URL]) {
    try { const r = await fetch(u); if (r.ok) { S.dex = await r.json(); break; } } catch (e) { }
  }
  if (!S.dex) return null;
  S.dexMapa = {}; S.dex.especies.forEach(e => { S.dexMapa[e[0].toLocaleLowerCase('es')] = e; });
  const op = l => l.map(v => `<option value="${esc(v)}">`).join('');
  $('#dl-especies').innerHTML = op(S.dex.especies.map(e => e[0])); $('#dl-movs').innerHTML = op(S.dex.movimientos);
  $('#dl-habs').innerHTML = op(S.dex.habilidades); $('#dl-objs').innerHTML = op(S.dex.objetos);
  return S.dex;
}

function formCarnet(c, clave) {
  const nuevo = !c; c = c || { pokemon: [] };
  cargarDex();
  const d = $('#dlgCarnetForm');
  const optEq = '<option value="">Sin team</option>' + S.d.equipos.map(e => `<option${e.nombre === c.equipo ? ' selected' : ''}>${esc(e.nombre)}</option>`).join('');
  const optTipo = v => '<option value="">—</option>' + Core.TIPOS.map(x => `<option${x === v ? ' selected' : ''}>${x}</option>`).join('');
  const slot = i => {
    const x = c.pokemon[i] || {}, m = x.movimientos || [];
    return `<details class="slot" data-slot="${i}"${i === 0 || x.especie ? ' open' : ''}><summary><span class="slot-n">${i + 1}</span><span class="slot-t">${esc(x.especie || 'Espacio libre')}</span></summary>
      <div class="campos dos">
        <label class="campo">Pokémon<input name="p${i}-especie" list="dl-especies" maxlength="24" value="${esc(x.especie || '')}" placeholder="Ej.: Lucario"><small>Si está en la Pokédex, se completan los tipos.</small></label>
        <label class="campo">Apodo<input name="p${i}-apodo" maxlength="16" value="${esc(x.apodo || '')}"></label>
        <label class="campo">Tipo 1<select name="p${i}-tipo1">${optTipo(x.tipo1)}</select></label>
        <label class="campo">Tipo 2<select name="p${i}-tipo2">${optTipo(x.tipo2)}</select></label>
        <label class="campo">Nivel<input name="p${i}-nivel" type="number" inputmode="numeric" min="1" max="100" value="${esc(x.nivel || '')}"></label>
        <label class="campo">Habilidad<input name="p${i}-habilidad" list="dl-hab-${i}" maxlength="28" value="${esc(x.habilidad || '')}"><datalist id="dl-hab-${i}"></datalist></label>
        <label class="campo">Objeto<input name="p${i}-objeto" list="dl-objs" maxlength="28" value="${esc(x.objeto || '')}"></label>
        <label class="chk" style="align-self:end;min-height:44px"><input type="checkbox" name="p${i}-shiny"${x.shiny ? ' checked' : ''}> Es shiny ✨</label>
        ${[0, 1, 2, 3].map(k => `<label class="campo">Movimiento ${k + 1}<input name="p${i}-m${k}" list="dl-movs" maxlength="24" value="${esc(m[k] || '')}"></label>`).join('')}
      </div></details>`;
  };
  d.innerHTML = `<form class="dlg" novalidate autocomplete="off">
    <div class="dlg-cab"><h2>${nuevo ? 'Crear mi carnet' : 'Editar carnet'}</h2><button class="x" type="button" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="dlg-cuerpo">
      <fieldset class="grupo"><legend>Entrenador</legend><div class="campos dos">
        <label class="campo">Nombre de entrenador *<input name="nombre" required maxlength="24" value="${esc(c.nombre || '')}"></label>
        <label class="campo">Team<select name="equipo">${optEq}</select></label>
        <label class="campo">Usuario en Reloaded Online<input name="usuario" maxlength="24" value="${esc(c.usuario || '')}"><small>Para que te encuentren y te desafíen.</small></label>
        <label class="campo">Lema<input name="lema" maxlength="90" value="${esc(c.lema || '')}" placeholder="Ej.: Ningún gimnasio me queda grande"></label>
        <label class="chk" style="grid-column:1/-1"><input type="checkbox" name="pvp"${c.pvp ? ' checked' : ''}> Acepto desafíos PvP</label>
        <p class="carnet-aviso">El carnet es público: no pongas tu nombre real, teléfono ni dirección.</p>
      </div></fieldset>
      <fieldset class="grupo"><legend>Equipo Pokémon</legend><p class="muted" style="font-size:14px;margin-bottom:10px">Hasta 6. Si dejás vacío el nombre, el espacio queda libre.</p><div class="slots">${[0, 1, 2, 3, 4, 5].map(slot).join('')}</div></fieldset>
      <fieldset class="grupo"><legend>${nuevo ? 'Tu clave' : 'Cambiar clave (opcional)'}</legend><p class="muted" style="font-size:14px">${nuevo ? 'La vas a usar para editar tu carnet. Guardala: después no se puede ver.' : 'Si no la querés cambiar, dejalo vacío.'}</p>
        <div class="campos dos"><label class="campo">${nuevo ? 'Clave *' : 'Clave nueva'}<input name="clave1" type="password" autocomplete="new-password"></label><label class="campo">Repetí la clave<input name="clave2" type="password" autocomplete="new-password"></label></div></fieldset>
      <input class="sr" name="web" tabindex="-1" autocomplete="off" aria-hidden="true">
      <p class="form-error" role="alert"></p>
      <div class="dlg-acc">${nuevo ? '' : '<button class="btn danger" type="button" data-borrar-carnet style="margin-right:auto">Borrar carnet</button>'}<button class="btn" type="button" data-cerrar>Cancelar</button><button class="btn sand" type="submit">${nuevo ? 'Crear carnet' : 'Guardar cambios'}</button></div>
    </div></form>`;
  const f = $('form', d), err = $('.form-error', d), b = $('[type=submit]', d);
  const completarEspecie = (i, auto) => {
    const nom = f.elements['p' + i + '-especie'].value.trim();
    $$('.slot-t', f)[i].textContent = nom || 'Espacio libre';
    const e = S.dexMapa && S.dexMapa[nom.toLocaleLowerCase('es')];
    const dl = $('#dl-hab-' + i, f);
    dl.innerHTML = (e ? e[3] : (S.dex ? S.dex.habilidades : [])).map(h => `<option value="${esc(h)}">`).join('');
    if (e && auto) { f.elements['p' + i + '-tipo1'].value = e[1]; f.elements['p' + i + '-tipo2'].value = e[2]; if (e[3].length === 1 && !f.elements['p' + i + '-habilidad'].value) f.elements['p' + i + '-habilidad'].value = e[3][0]; }
  };
  cargarDex().then(() => { for (let i = 0; i < 6; i++) completarEspecie(i, false); });
  const bb = $('[data-borrar-carnet]', f);
  if (bb) bb.onclick = () => confirmar('Borrar el carnet de ' + c.nombre, 'Se borra para siempre de la web y de la planilla. No se puede deshacer.', 'Borrar carnet', async () => {
    await llamar(clave || !esAdmin() ? 'carnetBorrarPropio' : 'carnetBorrar', { id: c.id, clave: clave || '' });
    const mi = MI.get(); if (mi && mi.id === c.id) MI.borrar();
    if (location.hash.indexOf(c.id) >= 0) history.replaceState(null, '', location.pathname + location.search);
    cerrar(d); toast('Carnet borrado.'); cargarCarnets();
  });
  f.addEventListener('input', ev => { const m = ev.target.name && ev.target.name.match(/^p(\d)-especie$/); if (m) completarEspecie(Number(m[1]), true); });
  f.onsubmit = async ev => {
    ev.preventDefault(); err.textContent = '';
    const v = n => (f.elements[n] ? f.elements[n].value : '');
    const datos = {
      nombre: v('nombre'), equipo: v('equipo'), usuario: v('usuario'), lema: v('lema'), pvp: f.elements.pvp.checked, web: v('web'),
      pokemon: [0, 1, 2, 3, 4, 5].map(i => ({ especie: v(`p${i}-especie`), apodo: v(`p${i}-apodo`), nivel: v(`p${i}-nivel`), tipo1: v(`p${i}-tipo1`), tipo2: v(`p${i}-tipo2`), habilidad: v(`p${i}-habilidad`), objeto: v(`p${i}-objeto`), movimientos: [0, 1, 2, 3].map(k => v(`p${i}-m${k}`)), shiny: f.elements[`p${i}-shiny`].checked }))
    };
    const c1 = v('clave1'), c2 = v('clave2');
    if (datos.nombre.trim().length < 2) { err.textContent = 'Escribí tu nombre de entrenador.'; f.elements.nombre.focus(); return; }
    if (nuevo && c1.length < 4) { err.textContent = 'Elegí una clave de al menos 4 caracteres.'; f.elements.clave1.focus(); return; }
    if (c1 && c1 !== c2) { err.textContent = 'Las claves no coinciden.'; f.elements.clave2.focus(); return; }
    b.disabled = true; const t0 = b.textContent; b.textContent = 'Guardando…';
    try {
      const r = nuevo ? await llamar('carnetCrear', Object.assign(datos, { clave: c1 }))
        : await llamar('carnetEditar', Object.assign(datos, { id: c.id, clave: clave || '', nuevaClave: c1 }));
      if (nuevo || clave) MI.set({ id: r.id, nombre: r.nombre });
      cerrar(d);
      toast(nuevo ? 'Listo: tu carnet ' + numCarnet(r.numero) + ' ya está publicado.' : 'Carnet actualizado.');
      cargarCarnets(); abrirCarnet(r.id);
    } catch (e) { err.textContent = e.message; }
    finally { b.disabled = false; b.textContent = t0; }
  };
  abrir(d); setTimeout(() => f.elements.nombre.focus(), 30);
}

function editarCarnet(id) {
  const c = S.carnetAbierto && S.carnetAbierto.id === id ? S.carnetAbierto : null; if (!c) return;
  if (esAdmin()) { cerrar($('#dlgCarnet')); formCarnet(c, ''); return; }
  formulario({
    titulo: 'Editar el carnet de ' + c.nombre, texto: 'Escribí la clave que elegiste al crearlo. Si no la recordás, pedile una nueva a un admin en el grupo.', boton: 'Seguir',
    campos: [{ n: 'clave', l: 'Clave del carnet', t: 'password', req: true }],
    enviar: async v => { await llamar('carnetVerificar', { id, clave: v.clave }); cerrar($('#dlgCarnet')); setTimeout(() => formCarnet(c, v.clave), 0); }
  });
}

function copiarTexto(texto) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(texto);
  const i = document.createElement('textarea'); i.value = texto; i.style.position = 'fixed'; i.style.opacity = '0'; document.body.appendChild(i); i.select();
  try { document.execCommand('copy'); } finally { i.remove(); }
  return Promise.resolve();
}

// ---------- Admin ----------
function controlMiembros(e) {
  const m = Core.cantidad(e.miembros);
  return `<span class="contador" data-mm="${esc(e.id)}"><button type="button" data-act="mm" data-paso="-1" aria-label="Restar un miembro a ${esc(e.nombre)}">−</button><input type="number" inputmode="numeric" min="0" max="999" value="${m}" data-mm-input aria-label="Miembros de ${esc(e.nombre)}"><button type="button" data-act="mm" data-paso="1" aria-label="Sumar un miembro a ${esc(e.nombre)}">+</button></span>`;
}
const cupo = () => { const n = Number(S.d.config && S.d.config.cupo); return n >= 1 ? n : Core.CUPO; };
const textoCupo = m => m >= cupo() ? m + ' de ' + cupo() + ' · Lleno' : m + ' de ' + cupo() + ' · quedan ' + (cupo() - m);

// Guardado instantáneo: se ve al toque y se guarda en Drive en segundo plano.
const MM = { timers: {}, optimista: {} };
function aplicarOptimista() { Object.keys(MM.optimista).forEach(id => { const e = S.d.equipos.find(x => x.id === id); if (e) e.miembros = String(MM.optimista[id]); }); }
function marcarMiembros(id, texto, clase) {
  $$(`[data-mm-estado="${CSS.escape(id)}"]`).forEach(s => { s.textContent = texto; s.className = 'mm-estado' + (clase ? ' ' + clase : ''); });
}
function cambiarMiembros(id, valor) {
  valor = Core.cantidad(valor);
  const e = S.d.equipos.find(x => x.id === id); if (!e) return;
  const antes = Core.cantidad(e.miembros);
  MM.optimista[id] = valor; e.miembros = String(valor);
  $$(`[data-mm="${CSS.escape(id)}"] input`).forEach(i => { if (document.activeElement !== i) i.value = valor; });
  marcarMiembros(id, textoCupo(valor) + ' · guardando…');
  renderTeams(); renderClasif();
  clearTimeout(MM.timers[id]);
  MM.timers[id] = setTimeout(async () => {
    try {
      const r = await llamar('equipoMiembros', { id, valor });
      if (MM.optimista[id] === valor) delete MM.optimista[id];
      if (r && r.equipos) { S.d = r; aplicarOptimista(); render(); }
      marcarMiembros(id, textoCupo(valor) + ' · guardado', 'ok');
      if (valor >= cupo() && antes < cupo()) toast(e.nombre + ' quedó lleno.');
    } catch (err) {
      delete MM.optimista[id];
      marcarMiembros(id, 'No se guardó: ' + err.message, 'mal');
      if (/sesión de admin venció/i.test(err.message)) salirAdmin(true);
    }
  }, 650);
}

function panelAdmin() {
  const z = S.d.territorios, ctrl = z.filter(t => t.estado === 'Controlada').length;
  const ubic = z.filter(t => t.x !== '' && t.x != null).length;
  const b = (act, titulo, sub) => `<button type="button" data-act="${act}"><b>${titulo}</b><span>${sub}</span></button>`;
  const d = $('#dlgPanel');
  d.innerHTML = `<div class="dlg"><div class="dlg-cab"><p class="muted">Reloaded Online</p><h2>Panel de administración</h2><button class="x" type="button" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="dlg-cuerpo panel-g">
      <div class="panel-stats"><div><b>${ctrl}/${z.length}</b><span>zonas con dueño</span></div><div><b>${S.d.guerras.length}</b><span>partes de guerra</span></div><div><b>${(S.carnets || []).length}</b><span>carnets</span></div><div><b>${ubic}</b><span>zonas en el mapa</span></div></div>
      <div><h3>Publicar</h3><div class="panel-btns">${b('nueva-noticia', 'Publicar noticia', 'Va a la portada')}${b('nueva-guerra', 'Registrar guerra', 'Conquista, defensa, disputa…')}${b('nuevo-torneo', 'Nuevo torneo', 'Aparece en el calendario')}${b('nuevo-combate', 'Registrar combate', 'Suma a la clasificación')}</div></div>
      <div><h3>Miembros por team</h3><div class="cupo-ctrl"><span><b>Cupo por team</b><small class="mm-estado" id="cupoEstado">Al llegar a este número, el team figura como Lleno.</small></span><span class="contador" data-cupo><button type="button" data-act="cupo" data-paso="-1" aria-label="Bajar el cupo">−</button><input type="number" inputmode="numeric" min="1" max="999" value="${cupo()}" data-cupo-input aria-label="Cupo de miembros por team"><button type="button" data-act="cupo" data-paso="1" aria-label="Subir el cupo">+</button></span></div><ul class="panel-miembros">${S.d.equipos.map(e => `<li style="--c:${esc(e.color)}"><span><b>${esc(e.emoji || '')} ${esc(e.nombre)}</b><small class="mm-estado" data-mm-estado="${esc(e.id)}">${textoCupo(Core.cantidad(e.miembros))}</small></span>${controlMiembros(e)}</li>`).join('')}</ul><p class="muted" style="font-size:13px;margin-top:8px">Escribí el número o usá − y +: se guarda solo.</p></div>
      <div><h3>Mundo</h3><div class="panel-btns">${b('nuevo-team', 'Nuevo team', 'Nombre, color y lore')}${b('nueva-zona', 'Nueva zona', 'Se suma al atlas')}${b('mapa-subir', 'Cambiar mapa', 'Imagen nueva en tu Drive')}</div></div>
      <div><h3>Miembros en WhatsApp</h3>${(S.d.grupos || []).length ? `<ul class="panel-miembros">${S.d.grupos.map(g => `<li style="--c:#25d366"><span><b>${esc(g.nombre)}</b><small class="mm-estado" data-gm-estado="${esc(g.id)}">${g.actualizado ? 'Actualizado ' + haceCuanto(g.actualizado) : 'Sin cargar todavía'}</small></span>${controlGrupo(g)}</li>`).join('')}</ul><p class="muted" style="font-size:13px;margin-top:8px">Mirá el número en la info del grupo de WhatsApp y escribilo: se muestra en la portada y en Comunidad.</p>` : '<p class="muted" style="font-size:13px">Pegá el Codigo.gs nuevo en Apps Script para activar el contador de WhatsApp.</p>'}</div>
      <div><h3>Comunidad</h3><div class="panel-btns">${b('mensajes', 'Mensajes' + (S.d.config && S.d.config.mensajes ? ' (' + S.d.config.mensajes + ')' : ''), S.d.config && S.d.config.mensajes ? 'Contacto y pedidos de retiro' : 'No hay mensajes nuevos')}</div></div>
      <div><h3>Cuenta</h3><div class="panel-btns">${b('planilla', 'Abrir planilla', 'Los datos en tu Drive')}${b('clave', 'Cambiar clave', 'Para entrar como admin')}${b('clave-editor', 'Clave del noticiero', S.d.config && S.d.config.editor ? 'Activa · cambiarla' : 'Noticias, zonas, reglas y crónica')}${S.d.config && S.d.config.editor ? b('quitar-editor', 'Quitar noticiero', 'Su clave deja de andar') : ''}${b('salir', 'Salir', 'Cerrar la sesión de admin')}</div></div>
      <p class="muted">Para editar un team, una zona o un carnet, abrí su ficha: las opciones de admin aparecen ahí.</p>
    </div></div>`;
  abrir(d);
}

function formGuerra() {
  const zonas = S.d.territorios.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const eqs = S.d.equipos.map(e => ({ v: e.nombre, l: e.nombre }));
  formulario({
    titulo: 'Registrar guerra', texto: 'El resultado actualiza la zona, el mapa, la crónica y la clasificación.', boton: 'Guardar resultado', dos: true,
    campos: [
      { n: 'territorio', l: 'Zona', t: 'select', req: true, ancho: true, opc: [{ v: '', l: 'Elegí una zona…' }].concat(zonas.map(t => ({ v: t.id, l: t.nombre + (t.estado === 'Controlada' ? ' · ' + t.equipo : ' · ' + t.estado) }))) },
      { n: 'accion', l: 'Qué pasó', t: 'select', ancho: true, opc: [{ v: 'conquista', l: 'Conquista: venció al team que la tenía' }, { v: 'toma', l: 'Tomó la zona libre' }, { v: 'defensa', l: 'Defendió y ganó' }, { v: 'disputa', l: 'Quedó en disputa' }, { v: 'resguardo', l: 'Resguardo del Escuadrón Élite' }, { v: 'liberacion', l: 'Liberada / neutral' }, { v: 'muerto', l: 'Marcar como Punto Muerto' }] },
      { n: 'ganador', l: 'Team ganador', t: 'select', opc: [{ v: '', l: 'Elegí un team…' }].concat(eqs) },
      { n: 'perdedor', l: 'Team derrotado o rival', t: 'select', opc: [{ v: '', l: 'Sin rival / zona libre' }].concat(eqs) },
      { n: 'nota', l: 'Nota (opcional)', ph: 'Ej.: captura compartida en el grupo', max: 200, ancho: true }
    ],
    enviar: async v => { const t = S.d.territorios.find(x => x.id === v.territorio); await accion('guerraRegistrar', v, 'Resultado guardado' + (t ? ' en ' + t.nombre : '')); }
  });
}

function entrarAdmin() {
  formulario({
    titulo: 'Acceso de administración', texto: MODO === 'demo' ? 'Estás en la demostración: la clave es demo.' : 'Entrá con la clave de admin o con la del noticiero. Se valida en el Drive de la comunidad.', boton: 'Entrar',
    campos: [{ n: 'clave', l: 'Clave', t: 'password', req: true }],
    enviar: async v => {
      const r = await llamar('login', { clave: v.clave });
      S.token = r.token; S.rol = r.rol || 'admin';
      almacen.set('rlo-token', S.token); almacen.set('rlo-rol', S.rol);
      await cargar();
      toast(esEditor() ? 'Sesión del noticiero iniciada: noticias, zonas, reglas y crónica.' : 'Sesión de admin iniciada.');
    }
  });
}
function salirAdmin(vencida) {
  if (S.token && !vencida) llamar('logout').catch(() => { });
  S.token = ''; S.rol = ''; almacen.set('rlo-token', ''); almacen.set('rlo-rol', ''); cancelarUbicar();
  if (vencida) toast('Tu sesión de admin venció. Volvé a ingresar.', 'error');
  if (!vencida) cargar(true); else render();
}

function ubicar(id, serie) {
  const t = S.d.territorios.find(x => x.id === id); if (!t) return;
  cambiarRegion(Core.regionDe(t)); // se puede pasar a la otra región con las flechas antes de tocar el mapa
  S.ubicando = id; S.ubicarSerie = !!serie; document.body.classList.add('ubicando');
  $$('#ubicarNombre, #ubicarNombre2').forEach(b => { b.textContent = t.nombre; });
  const quedan = pendientesUbicar().length;
  $$('.ubicar-falta').forEach(s => { s.textContent = serie ? ' · faltan ' + quedan : ''; });
  $$('[data-serie]').forEach(b => { b.hidden = !serie; });
  $$('[data-act="cancelar-ubicar"]').forEach(b => { b.textContent = serie ? 'Terminar' : 'Cancelar'; });
  $$('#avisoUbicar, #avisoUbicar2').forEach(a => { a.hidden = false; });
  cerrar($('#dlgZona')); abrir($('#dlgMapa'));
}
/** Zonas de la región que se está viendo sin lugar en el mapa: primero las que tienen dueño o están en disputa (llevan emblema). */
function pendientesUbicar() {
  const sin = zonasRegion(S.region).filter(t => (t.x === '' || t.x == null) && !(S.saltadas || []).includes(t.id));
  const peso = t => t.estado === 'Controlada' || t.estado === 'En disputa' ? 0 : 1;
  return sin.sort((a, b) => peso(a) - peso(b));
}
function ubicarSiguiente() {
  const sig = pendientesUbicar()[0];
  if (!sig) { cancelarUbicar(); cerrar($('#dlgMapa')); S.saltadas = []; toast('Listo: no quedan zonas por ubicar.'); renderMapa(); return; }
  ubicar(sig.id, true);
}
function cancelarUbicar() {
  if (S.ubicarSerie) S.saltadas = [];
  S.ubicando = null; S.ubicarSerie = false; document.body.classList.remove('ubicando');
  $$('#avisoUbicar, #avisoUbicar2').forEach(a => { a.hidden = true; });
}
function marcarPin(id) {
  const t = S.d.territorios.find(x => x.id === id); if (t) cambiarRegion(Core.regionDe(t));
  cerrar($('#dlgZona')); cerrar($('#dlgTeam'));
  const donde = hay('#mapa') ? '#mapa' : '#dlgMapa';
  if (donde === '#mapa') ir('mapa'); else abrir($('#dlgMapa'));
  setTimeout(() => { const p = $(`${donde} .pin[data-id="${CSS.escape(id)}"]`); if (p) { p.classList.remove('marcado'); void p.offsetWidth; p.classList.add('marcado'); p.focus({ preventScroll: true }); } }, 450);
}

// ---------- Eventos ----------
document.addEventListener('click', async ev => {
  const pkl = MULTIPAGINA && ev.target.closest('a[data-poke]');
  if (pkl && ev.button === 0 && !ev.ctrlKey && !ev.metaKey && !ev.shiftKey && !ev.altKey) { ev.preventDefault(); abrirPokemon(pkl.dataset.poke); return; }
  const cerrarBtn = ev.target.closest('[data-cerrar]');
  if (cerrarBtn) { const d = cerrarBtn.closest('dialog'); if (d) { if (d.id === 'dlgMapa') cancelarUbicar(); cerrar(d); } return; }
  const destino = ev.target.closest('[data-ir]');
  if (destino) {
    if (MULTIPAGINA && !document.getElementById(destino.dataset.ir) && destino.tagName === 'A' && !/^#/.test(destino.getAttribute('href') || '#')) return;
    ev.preventDefault(); $$('dialog[open]').forEach(cerrar); ir(destino.dataset.ir); return;
  }
  const escena = ev.target.closest('[data-escena]');
  if (escena && S.ubicando) {
    const img = $('.mapa-img', escena); if (!img || img.hidden) return;
    const r = img.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width * 100, y = (ev.clientY - r.top) / r.height * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return;
    const id = S.ubicando, t = S.d.territorios.find(z => z.id === id), serie = S.ubicarSerie;
    if (serie) { S.ubicando = null; } else cancelarUbicar();
    try {
      await accion('zonaUbicar', { id, x, y, region: S.region }, (t ? t.nombre : 'La zona') + ' quedó marcada en el mapa' + (t && Core.regionDe(t) !== S.region ? ' de ' + REG_TITULO[S.region] : ''));
      if (serie) ubicarSiguiente(); else { cerrar($('#dlgMapa')); marcarPin(id); }
    } catch (e) { toast(e.message, 'error'); if (serie) ubicar(id, true); }
    return;
  }
  const el = ev.target.closest('[data-act]'); if (!el) return;
  const id = el.dataset.id, a = el.dataset.act;
  const borrar = (titulo, texto, op, msg) => confirmar(titulo, texto, 'Borrar', () => accion(op, { id }, msg));
  try {
    switch (a) {
      case 'team': fichaTeam(id); break;
      case 'carnet': cerrar($('#dlgTeam')); abrirCarnet(id); break;
      case 'carnet-nuevo': formCarnet(null); break;
      case 'carnet-editar': editarCarnet(id); break;
      case 'copiar': await copiarTexto(el.dataset.url); toast('Enlace copiado.'); break;
      case 'carnet-borrar': confirmar('Borrar carnet', 'Se borra el carnet. No se puede deshacer.', 'Borrar', async () => { await llamar('carnetBorrar', { id }); cerrar($('#dlgCarnet')); toast('Carnet borrado.'); cargarCarnets(); }); break;
      case 'carnet-clave': confirmar('Clave nueva', 'Se genera una clave nueva para este carnet y la anterior deja de funcionar.', 'Generar clave', async () => { const r = await llamar('carnetClave', { id }); setTimeout(() => formulario({ titulo: 'Clave nueva: ' + r.clave, texto: 'Pasásela por privado al dueño del carnet. Con esta clave puede editarlo y elegir otra.', boton: 'Copiar y cerrar', enviar: () => copiarTexto(r.clave) }), 0); }); break;
      case 'zona': cerrar($('#dlgTeam')); cerrar($('#dlgMapa')); fichaZona(id); break;
      case 'filtro': S.filtro = el.dataset.f; renderAtlas(); break;
      case 'mas-guerras': S.verGuerras += 20; renderCronica(); break;
      case 'ampliar': abrir($('#dlgMapa')); break;
      case 'region': cambiarRegion(regionVecina(+el.dataset.dir || 1)); break;
      case 'ver-en-mapa': marcarPin(id); break;
      case 'cancelar-ubicar': { const eraSerie = S.ubicarSerie; cancelarUbicar(); if (eraSerie) { cerrar($('#dlgMapa')); renderMapa(); } break; }
      case 'saltar-ubicar': S.saltadas = (S.saltadas || []).concat(S.ubicando ? [S.ubicando] : []); ubicarSiguiente(); break;
      case 'ubicar-pendientes': S.saltadas = []; ubicarSiguiente(); break;
      case 'ubicar': ubicar(id); break;
      case 'desubicar': await accion('zonaUbicar', { id, x: '' }, 'Zona quitada del mapa'); fichaZona(id); break;
      case 'editar-zona': formZona(S.d.territorios.find(x => x.id === id)); break;
      case 'borrar-zona': cerrar($('#dlgZona')); borrar('Borrar zona', 'Se borra la zona del atlas junto con su historial. No se puede deshacer.', 'zonaBorrar', 'Zona borrada'); break;
      case 'editar-team': formTeam(S.d.equipos.find(x => x.id === id)); break;
      case 'wiki': { const z = el.dataset.zona; if ($('#dlgZona').open) cerrar($('#dlgZona')); abrirWiki(z); break; }
      case 'wiki-filtro': WK.filtro = el.dataset.f; renderWiki(); break;
      case 'wk-reintentar': el.closest('[data-wk-carga]').innerHTML = '<p class="wk-cargando"><i></i>Reintentando…</p>'; WK_CARGAS[el.dataset.carga](); break;
      case 'dex-grupo': DEX.grupo = el.dataset.f; renderDex(); break;
      case 'leg-filtro': LEG.g = el.dataset.f; renderLeg(); break;
      case 'obj-area': OBJ.area = el.dataset.f; renderObj(); break;
      case 'mov-tab': MOV.tab = el.dataset.f; renderMov(); break;
      case 'hab-filtro': HAB.solo = el.dataset.f; renderHab(); break;
      case 'pj-filtro': PJ.g = el.dataset.f; PJ.reg = ''; renderPj(); break;
      case 'pj-region': PJ.reg = el.dataset.f; renderPj(); break;
      case 'pk-tab': { const d = el.closest('.dlg'); $$('.pk-tabs .chip', d).forEach(b => b.setAttribute('aria-pressed', String(b === el))); $$('.pk-movs', d).forEach(m => { m.hidden = m.dataset.i !== el.dataset.i; }); break; }
      case 'pk-donde': pkDonde(el.dataset.n, el.closest('[data-donde]')); break;
      case 'pk-reintentar': abrirPokemon(el.dataset.n, true); break;
      case 'wiki-a-zona': cerrar($('#dlgWiki')); fichaZona(id); break;
      case 'wiki-editar': formWiki(el.dataset.zona || $('#dlgWiki').dataset.zona); break;
      case 'regla-nueva': formRegla(); break;
      case 'regla-editar': formRegla((S.d.reglas || []).find(x => x.id === id)); break;
      case 'regla-mover': await accion('reglaMover', { id, dir: el.dataset.dir }, 'Orden de las reglas actualizado'); break;
      case 'regla-borrar': { const r = (S.d.reglas || []).find(x => x.id === id); confirmar('Borrar regla', 'Se quita “' + (r ? r.titulo : 'la regla') + '” de la sección Reglas. No se puede deshacer.', 'Borrar', async () => { await accion('reglaBorrar', { id }, 'Regla borrada'); }); break; }
      case 'cupo': { const inp = $('[data-cupo-input]'); const v = Math.min(999, Math.max(1, (Number(inp.value) || cupo()) + Number(el.dataset.paso))); inp.value = v; cambiarCupo(v); break; }
      case 'gm': { const caja = el.closest('[data-gm]'), inp = $('input', caja); const v = cantGrupo(cantGrupo(inp.value) + Number(el.dataset.paso)); inp.value = v; cambiarGrupo(caja.dataset.gm, v); break; }
      case 'mm': { const caja = el.closest('[data-mm]'), inp = $('input', caja); const v = Core.cantidad(inp.value) + Number(el.dataset.paso); inp.value = Core.cantidad(v); cambiarMiembros(caja.dataset.mm, v); break; }
      case 'borrar-team': cerrar($('#dlgTeam')); borrar('Quitar team', 'El team deja de aparecer. Sus zonas conservan el nombre hasta que las edites.', 'equipoBorrar', 'Team quitado'); break;
      case 'borrar-guerra': borrar('Borrar del historial', 'Se borra este parte de la crónica. El estado actual de la zona no cambia.', 'guerraBorrar', 'Parte borrado'); break;
      case 'editar-noticia': formNoticia(S.d.noticias.find(x => x.id === id)); break;
      case 'borrar-noticia': borrar('Borrar noticia', 'La noticia se borra del archivo.', 'noticiaBorrar', 'Noticia borrada'); break;
      case 'editar-torneo': formTorneo(S.d.torneos.find(x => x.id === id)); break;
      case 'borrar-torneo': borrar('Quitar torneo', 'El torneo deja de aparecer en el calendario.', 'torneoBorrar', 'Torneo quitado'); break;
      case 'borrar-combate': borrar('Borrar combate', 'El combate se borra del registro.', 'combateBorrar', 'Combate borrado'); break;
      case 'panel': panelAdmin(); break;
      case 'nueva-guerra': cerrar($('#dlgPanel')); formGuerra(); break;
      case 'nueva-noticia': cerrar($('#dlgPanel')); formNoticia(); break;
      case 'nuevo-torneo': cerrar($('#dlgPanel')); formTorneo(); break;
      case 'nuevo-combate': cerrar($('#dlgPanel')); formCombate(); break;
      case 'nuevo-team': cerrar($('#dlgPanel')); formTeam(); break;
      case 'nueva-zona': cerrar($('#dlgPanel')); formZona(); break;
      case 'mapa-subir': cerrar($('#dlgPanel')); formulario({
        titulo: 'Cambiar el mapa territorial', texto: 'La imagen se guarda en tu carpeta de Drive y reemplaza al mapa de esa región. Las zonas ya marcadas mantienen su posición.', boton: 'Subir mapa',
        campos: [{ n: 'region', l: 'Región', t: 'select', v: S.region, opc: Core.REGIONES.map(r => ({ v: r.id, l: r.nombre })) }, { n: 'archivo', l: 'Imagen del mapa (PNG, JPG o WEBP, hasta 10 MB)', t: 'file', req: true }],
        enviar: async v => { const f = v.archivo; if (!f) throw new Error('Elegí una imagen.'); if (f.size > 10 * 1024 * 1024) throw new Error('La imagen pesa más de 10 MB.'); const rg = Core.region(v.region) || 'star'; $$('.mapa-img').forEach(i => { i.dataset.k = ''; }); S.region = rg; await accion('mapaSubir', { region: rg, nombre: f.name, mime: f.type, base64: await leerArchivo(f) }, 'Mapa de ' + REG_TITULO[rg] + ' actualizado'); }
      }); break;
      case 'planilla': {
        const u = S.d.config && S.d.config.hojaUrl;
        if (!u) { toast(MODO === 'demo' ? 'En la demostración no hay planilla: los datos están en este navegador.' : 'No encontré el enlace de la planilla.', 'error'); break; }
        const l = document.createElement('a'); l.href = u; l.target = '_blank'; l.rel = 'noopener'; document.body.appendChild(l); l.click(); l.remove(); break;
      }
      case 'clave': cerrar($('#dlgPanel')); formulario({
        titulo: 'Cambiar clave de admin', boton: 'Cambiar clave',
        campos: [{ n: 'actual', l: 'Clave actual', t: 'password', req: true }, { n: 'nueva', l: 'Clave nueva (mínimo 8 caracteres)', t: 'password', req: true }, { n: 'repetir', l: 'Repetí la clave nueva', t: 'password', req: true }],
        enviar: async v => { if (v.nueva !== v.repetir) throw new Error('Las claves nuevas no coinciden.'); await llamar('clave', { actual: v.actual, nueva: v.nueva }); toast('Clave cambiada. Usala la próxima vez que entres.'); }
      }); break;
      case 'clave-editor': cerrar($('#dlgPanel')); formulario({
        titulo: 'Clave del noticiero', texto: 'Quien entre con esta clave maneja las noticias, quién tiene cada zona, la crónica de guerra, los puntos del mapa y las reglas. No puede tocar teams, torneos, carnets ni claves. Si ya había una, se reemplaza y la sesión anterior se cierra.', boton: 'Guardar clave',
        campos: [{ n: 'nueva', l: 'Clave del noticiero (mínimo 8 caracteres)', t: 'password', req: true }, { n: 'repetir', l: 'Repetí la clave', t: 'password', req: true }],
        enviar: async v => { if (v.nueva !== v.repetir) throw new Error('Las claves no coinciden.'); await llamar('claveEditor', { nueva: v.nueva }); await cargar(true); toast('Clave del noticiero guardada. Pasásela por privado a quien lleve las noticias.'); }
      }); break;
      case 'quitar-editor': cerrar($('#dlgPanel')); confirmar('Quitar noticiero', 'La clave del noticiero deja de funcionar y su sesión se cierra.', 'Quitar', async () => { await llamar('claveEditor', { quitar: true }); await cargar(true); toast('Acceso del noticiero quitado.'); }); break;
      case 'mensajes': cerrar($('#dlgPanel')); verMensajes(); break;
      case 'borrar-mensaje': confirmar('Borrar mensaje', 'Se borra de la web y de la pestaña Contacto de la planilla.', 'Borrar', async () => { pintarMensajes(await llamar('mensajeBorrar', { id })); cargar(true); }); break;
      case 'salir': cerrar($('#dlgPanel')); salirAdmin(); break;
    }
  } catch (e) { toast(e.message, 'error'); }
});

$('#btnMenu').addEventListener('click', () => abrir($('#dlgMenu')));
if (hay('#gridCarnets')) {
  $('#buscarCarnet').addEventListener('input', e => { S.qc = e.target.value; renderCarnets(); });
  $('#filtroCarnet').addEventListener('change', e => { S.fc = e.target.value; renderCarnets(); });
  $('#soloPvp').addEventListener('change', e => { S.pvp = e.target.checked; renderCarnets(); });
}
$('#dlgCarnet').addEventListener('close', () => { if (/^#carnet\//.test(location.hash)) history.replaceState(null, '', location.pathname + location.search); });
const rutaCarnet = () => { const m = location.hash.match(/^#carnet\/([\w-]+)/); if (m) abrirCarnet(m[1]); };
window.addEventListener('hashchange', rutaCarnet);
document.addEventListener('input', ev => { const i = ev.target.closest('[data-mm-input]'); if (i && i.value !== '') cambiarMiembros(i.closest('[data-mm]').dataset.mm, i.value); });
document.addEventListener('input', ev => { const i = ev.target.closest('[data-cupo-input]'); if (i && i.value !== '') cambiarCupo(i.value); });
document.addEventListener('input', ev => { const i = ev.target.closest('[data-gm-input]'); if (i && i.value !== '') cambiarGrupo(i.closest('[data-gm]').dataset.gm, i.value); });
document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.closest('[data-gm-input]')) { ev.preventDefault(); ev.target.blur(); } });
document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.closest('[data-mm-input]')) { ev.preventDefault(); ev.target.blur(); } });
document.addEventListener('focusout', ev => { const i = ev.target.closest && ev.target.closest('[data-mm-input]'); if (i && i.value === '') { const e = S.d.equipos.find(x => x.id === i.closest('[data-mm]').dataset.mm); if (e) i.value = Core.cantidad(e.miembros); } });
if (hay('#buscarZona')) $('#buscarZona').addEventListener('input', e => { S.q = e.target.value; renderAtlas(); });
if (hay('#dialogo')) $('#dialogo').addEventListener('click', ev => { if (ev.target.closest('a')) return; const p = $('#notCuerpo'); if (p.textContent !== p.dataset.texto) { p.dataset.saltar = '1'; p.textContent = p.dataset.texto; } else ir('cronica'); });
$('#dlgMapa').addEventListener('close', cancelarUbicar);
$$('dialog').forEach(d => d.addEventListener('click', ev => { if (ev.target === d) { if (d.id === 'dlgMapa') cancelarUbicar(); cerrar(d); } }));

// ---------- Miembros en WhatsApp (los carga el admin desde el Panel) ----------
const cantGrupo = v => { const n = Math.floor(Number(v)); return isFinite(n) && n > 0 ? Math.min(n, 100000) : 0; };
const numES = n => Number(n).toLocaleString('es-AR');
function haceCuanto(iso) {
  const t = Date.parse(iso); if (!t) return '';
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'recién'; if (m < 60) return 'hace ' + m + ' min';
  const h = Math.round(m / 60); if (h < 24) return 'hace ' + h + ' h';
  const d = Math.round(h / 24); return d === 1 ? 'ayer' : 'hace ' + d + ' días';
}
function renderGrupos() {
  const gs = (S.d.grupos || []).filter(g => cantGrupo(g.miembros) > 0);
  const link = g => /^https:\/\//.test(g.enlace || '') ? g.enlace : '#comunidad';
  const cont = $('#wppCont'), hero = $('#wppHero');
  if (cont) {
    cont.hidden = !gs.length;
    cont.innerHTML = gs.length ? `<h3>Somos la comunidad en WhatsApp</h3><div class="wpp-g">${gs.map(g => `<a class="wpp" href="${esc(link(g))}" target="_blank" rel="noopener"><b>${numES(cantGrupo(g.miembros))}</b><span>${esc(g.nombre)}</span><small>${g.actualizado ? 'Actualizado ' + haceCuanto(g.actualizado) : ''}</small></a>`).join('')}</div><p class="wpp-nota">WhatsApp no comparte este dato automáticamente: lo actualiza la administración.</p>` : '';
  }
  if (hero) {
    hero.hidden = !gs.length;
    hero.innerHTML = gs.length ? '<i aria-hidden="true"></i><span>' + gs.map(g => '<b>' + numES(cantGrupo(g.miembros)) + '</b> en el ' + esc(String(g.nombre).replace(/^Grupo /i, 'grupo '))).join(' · ') + '</span>' : '';
  }
}
function controlGrupo(g) {
  const m = cantGrupo(g.miembros);
  return `<span class="contador" data-gm="${esc(g.id)}"><button type="button" data-act="gm" data-paso="-1" aria-label="Restar uno a ${esc(g.nombre)}">−</button><input type="number" inputmode="numeric" min="0" max="100000" value="${m}" data-gm-input aria-label="Miembros de ${esc(g.nombre)}"><button type="button" data-act="gm" data-paso="1" aria-label="Sumar uno a ${esc(g.nombre)}">+</button></span>`;
}
const CP = { timer: 0, optimista: null };
function cambiarCupo(valor) {
  valor = Math.floor(Number(valor));
  const est = $('#cupoEstado');
  if (!(valor >= 1 && valor <= 999)) { if (est) { est.textContent = 'Tiene que ser un número entre 1 y 999.'; est.className = 'mm-estado mal'; } return; }
  S.d.config = Object.assign({}, S.d.config, { cupo: valor }); CP.optimista = valor;
  S.d.equipos.forEach(e => marcarMiembros(e.id, textoCupo(Core.cantidad(e.miembros))));
  renderTeams();
  if (est) { est.textContent = 'Cupo ' + valor + ' · guardando…'; est.className = 'mm-estado'; }
  clearTimeout(CP.timer);
  CP.timer = setTimeout(async () => {
    try {
      const r = await llamar('cupo', { valor });
      if (r && r.equipos) {
        S.d = r; aplicarOptimista();
        if (CP.optimista !== valor) S.d.config.cupo = CP.optimista;
        render();
      }
      CP.optimista = null;
      const e2 = $('#cupoEstado'); if (e2) { e2.textContent = 'Cupo ' + valor + ' · guardado'; e2.className = 'mm-estado ok'; }
    } catch (err) {
      const e2 = $('#cupoEstado'); if (e2) { e2.textContent = 'No se guardó: ' + err.message; e2.className = 'mm-estado mal'; }
      if (/sesión de admin venció/i.test(err.message)) salirAdmin(true);
    }
  }, 650);
}
const GM = { timers: {}, optimista: {} };
function marcarGrupo(id, texto, clase) { $$(`[data-gm-estado="${CSS.escape(id)}"]`).forEach(s => { s.textContent = texto; s.className = 'mm-estado' + (clase ? ' ' + clase : ''); }); }
function cambiarGrupo(id, valor) {
  valor = cantGrupo(valor);
  const g = (S.d.grupos || []).find(x => x.id === id); if (!g) return;
  GM.optimista[id] = valor; g.miembros = String(valor); g.actualizado = new Date().toISOString();
  $$(`[data-gm="${CSS.escape(id)}"] input`).forEach(i => { if (document.activeElement !== i) i.value = valor; });
  marcarGrupo(id, numES(valor) + ' · guardando…'); renderGrupos();
  clearTimeout(GM.timers[id]);
  GM.timers[id] = setTimeout(async () => {
    try {
      const r = await llamar('grupoMiembros', { id, valor });
      if (GM.optimista[id] === valor) delete GM.optimista[id];
      if (r && r.equipos) {
        S.d = r; aplicarOptimista();
        Object.keys(GM.optimista).forEach(k => { const x = (S.d.grupos || []).find(y => y.id === k); if (x) x.miembros = String(GM.optimista[k]); });
        render();
      }
      marcarGrupo(id, numES(valor) + ' · guardado', 'ok');
    } catch (err) {
      delete GM.optimista[id];
      marcarGrupo(id, 'No se guardó: ' + err.message, 'mal');
      if (/sesión de admin venció/i.test(err.message)) salirAdmin(true);
    }
  }, 650);
}

// ---------- Wiki de la Región Star: resúmenes propios + datos en vivo de la Wiki PokemonReloaded ----------
const WK = {
  api: 'https://pokemonreloaded.fandom.com/es/api.php', web: 'https://pokemonreloaded.fandom.com/es/wiki/',
  paginas: { 'Gran Isla Estelar': 'Región Star', 'Torre pokémon': 'Torre Pokémon', 'Desierto de Gaara': 'Desierto del Gaara' },
  grupos: [
    { id: 'todas', l: 'Todas' }, { id: 'pob', l: 'Ciudades y pueblos', re: /^(Ciudad|Pueblo|Puerto)$/ }, { id: 'nat', l: 'Naturaleza', re: /^(Bosque|Playa|Zona natural|Pantano|Desierto)$/ },
    { id: 'cue', l: 'Cuevas', re: /^Cueva$/ }, { id: 'isl', l: 'Islas', re: /^(Isla|Archipiélago|Región)$/ }, { id: 'esp', l: 'Lugares especiales', re: /^(Liga|Edificio|Ruinas)$/ }
  ],
  mem: {}, filtro: 'todas', q: '', busq: 0
};
const wkNorm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const wkSlug = s => wkNorm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const wkUrl = t => WK.web + encodeURIComponent(String(t).replace(/ /g, '_'));
const wkBase = () => WK.base || (WK.base = Core.semilla().wiki);
const wkTexto = zona => (Array.isArray(S.d.wiki) ? S.d.wiki : wkBase()).find(w => w.zona === zona) || wkBase().find(w => w.zona === zona) || { zona, resumen: '', notas: '' };
const wkZonas = () => S.d.territorios.length ? S.d.territorios : wkBase().map(w => ({ id: 'z-' + wkSlug(w.zona), nombre: w.zona, tipo: '', estado: 'Neutral', equipo: '' }));
async function wkApi(q) {
  const r = await fetch(WK.api + '?origin=*&format=json&' + q);
  if (!r.ok) throw new Error('La wiki no respondió (' + r.status + ').');
  return r.json();
}
function wkCache(k, horas, v) {
  if (v !== undefined) {
    const s = JSON.stringify({ t: Date.now(), v });
    try { localStorage.setItem('wk:' + k, s); } catch (e) {
      try { Object.keys(localStorage).filter(x => /^wk:(pk1|z\d|loc|donde1):/.test(x)).forEach(x => localStorage.removeItem(x)); localStorage.setItem('wk:' + k, s); } catch (e2) { }
    }
    return v;
  }
  try {
    const x = JSON.parse(localStorage.getItem('wk:' + k) || 'null');
    return x && Date.now() - x.t < horas * 3600e3 ? x.v : null;
  } catch (e) { return null; }
}
async function wkPokes() {
  if (WK.pokes) return WK.pokes;
  let lista = wkCache('pokes', 24 * 7);
  if (!lista) {
    lista = []; let cont = '';
    for (let k = 0; k < 6; k++) {
      const r = await wkApi('action=query&list=categorymembers&cmlimit=500&cmnamespace=0&cmtitle=' + encodeURIComponent('Categoría:Lista de Pokémon por nombre') + cont);
      r.query.categorymembers.forEach(m => lista.push(m.title));
      if (!r.continue) break; cont = '&cmcontinue=' + encodeURIComponent(r.continue.cmcontinue);
    }
    wkCache('pokes', 0, lista);
  }
  return (WK.pokes = new Set(lista));
}
const wkLimpiar = s => String(s || '')
  .replace(/<ref[\s\S]*?<\/ref>|<ref[^>]*\/>/g, '')
  .replace(/\[\[(?:Archivo|File|Imagen|Image|Categoría|Category):[^\]]*\]\]/gi, '')
  .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1').replace(/\[\[([^\]]*)\]\]/g, '$1')
  .replace(/\[https?:\/\/\S+\s([^\]]*)\]/g, '$1').replace(/\[https?:\/\/\S+\]/g, '').replace(/'{2,}/g, '')
  .replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\{\{[^{}]*\}\}/g, '').replace(/\{\{[^{}]*\}\}/g, '')
  .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
function wkPlantilla(s) {
  s = s.trimStart(); if (!s.startsWith('{{')) return null;
  let d = 0, i = 0;
  for (; i < s.length; i++) { if (s.startsWith('{{', i)) { d++; i++; } else if (s.startsWith('}}', i)) { d--; i++; if (!d) break; } }
  const cuerpo = s.slice(2, i - 1), partes = []; let k = 0, cur = '';
  for (let j = 0; j < cuerpo.length; j++) {
    const c2 = cuerpo.slice(j, j + 2);
    if (c2 === '{{' || c2 === '[[') { k++; cur += c2; j++; continue; }
    if (c2 === '}}' || c2 === ']]') { k--; cur += c2; j++; continue; }
    if (cuerpo[j] === '|' && !k) { partes.push(cur); cur = ''; } else cur += cuerpo[j];
  }
  partes.push(cur);
  const params = {}; partes.shift();
  partes.forEach(x => { const e = x.indexOf('='); if (e > 0) params[x.slice(0, e).trim().toLowerCase()] = x.slice(e + 1).trim(); });
  return { params, fin: i + 1 };
}
function wkSecciones(wt) {
  const out = [], re = /^(={2,4})\s*(.*?)\s*\1\s*$/gm; let m, ult = null;
  while ((m = re.exec(wt))) { if (ult) ult.texto = wt.slice(ult.ini, m.index); ult = { titulo: wkLimpiar(m[2]), ini: re.lastIndex }; out.push(ult); }
  if (ult) ult.texto = wt.slice(ult.ini);
  return out;
}
const wkLinks = s => [...s.matchAll(/\[\[(?!Archivo|File|Imagen|Image)([^\]|#]+)[^\]]*\]\]/g)].map(x => x[1].trim());
const wkCeldas = fila => fila.split(/\n\||\|\|/).map(c => wkLimpiar(c.replace(/^[^|\n]*?(align|style|scope|class|colspan|rowspan)[^|]*\|/, ''))).filter(Boolean);
function wkTablaPokemon(txt, POK) {
  const res = []; let metodo = '';
  txt.replace(/^\{\|.*$/gm, '').replace(/^\|\}.*$/gm, '').split(/\n\|-/).forEach(fila => {
    const poke = wkLinks(fila).find(l => POK.has(l));
    if (!poke) {
      if (/^\s*!/m.test(fila) || /colspan/.test(fila)) {
        const tx = wkLimpiar(fila.replace(/^[^|\n]*?(align|style|scope|class|colspan)[^|]*\|/gm, '').replace(/^\s*!/gm, ''));
        const img = (fila.match(/\[\[(?:Archivo|File):([^\]|.]+)/) || [])[1];
        const cand = tx && !/^(Pokémon|Nivel|Probabilidad|Horario|Icono|Objeto|Sprite)/i.test(tx) && !/class=|Probabilidad/.test(tx) ? tx : (img && !/sprite/i.test(img) ? img : '');
        if (cand) metodo = cand.replace(/_/g, ' ').slice(0, 40);
      }
      return;
    }
    const d = { n: poke, m: metodo, niv: '', prob: '', hor: '', nota: '' };
    wkCeldas(fila).filter(c => !c.includes(poke)).forEach(c => {
      if (/%/.test(c) && !d.prob) d.prob = c;
      else if (/(día|noche|mañana|tarde)/i.test(c) && !d.hor) d.hor = c.replace(/\.$/, '');
      else if (/^(nv\.?\s*)?\d+(\s*[~\-–a]\s*\d+)?$/i.test(c) && !d.niv) d.niv = c.replace(/\s+/g, '');
      else if (!d.nota && c.length < 90) d.nota = c;
    });
    res.push(d);
  });
  const vistos = new Set();
  return res.filter(x => { const k = [x.n, x.m, x.niv, x.prob, x.hor].join('|'); if (vistos.has(k)) return false; vistos.add(k); return true; });
}
function wkTablaObjetos(txt, POK) {
  const res = [];
  txt.replace(/^\{\|.*$/gm, '').replace(/^\|\}.*$/gm, '').split(/\n\|-/).forEach(fila => {
    if (/^\s*!/m.test(fila) && !/\n\|/.test(fila)) return;
    const links = wkLinks(fila).filter(l => !POK.has(l)), celdas = wkCeldas(fila);
    if (!celdas.length) return;
    const n = links[0] ? wkLimpiar(links[0]) : celdas[0];
    if (!n || n.length > 40 || /^(Icono|Objeto|Localizaci)/i.test(n)) return;
    res.push({ n, d: celdas.filter(c => c !== n && !c.startsWith(n)).join(' · ').slice(0, 140) });
  });
  return res;
}
/** Pokémon salvajes de una página: tablas con encabezado "Pokémon" (sin entrenadores ni objetos) o dentro de una sección de Pokémon. */
function wkSalvajes(wt, POK) {
  const hs = [...wt.matchAll(/^(={2,4})\s*(.*?)\s*\1\s*$/gm)].map(m => ({ i: m.index, t: wkLimpiar(m[2]) })), out = [], re = /\{\|[\s\S]*?\n\|\}/g; let m;
  while ((m = re.exec(wt))) {
    const tb = m[0], cab = wkLimpiar((tb.match(/^\s*!.*$/gm) || []).join(' ')), sec = hs.filter(h => h.i < m.index).pop(), st = sec ? sec.t : '';
    if (/entrenador|l[ií]der|objeto/i.test(cab) || /entrenador|l[ií]der|alto mando|campe[oó]n|objetos|inicial/i.test(st)) continue;
    if (!(/pok[eé]mon/i.test(cab) && /probabilidad|nivel|%|horario/i.test(cab)) && !/pok[eé]mon|salvaje/i.test(st)) continue;
    wkTablaPokemon(tb, POK).forEach(x => { if (!x.m && st && !/pok[eé]mon|salvaje/i.test(st) && st.length <= 40) x.m = st; out.push(x); });
  }
  const vistos = new Set();
  return out.filter(x => { const k = [x.n, x.m, x.niv, x.prob, x.hor].join('|'); if (vistos.has(k)) return false; vistos.add(k); return true; });
}
async function wkGimnasio(wt) {
  const m = wt.match(/\[\[(Gimnasio [^\]|#]+)(?:\|[^\]]*)?\]\]/); if (!m) return null;
  const j = await wkApi('action=parse&prop=wikitext&redirects=1&page=' + encodeURIComponent(m[1]));
  if (!j.parse) return null;
  const pl = wkPlantilla(j.parse.wikitext['*']); if (!pl) return null;
  const p = pl.params, cap = s => wkLimpiar(s).split('/').map(x => x.trim()).filter(Boolean).map(x => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase()).join('/');
  return { nombre: j.parse.title, lider: wkLimpiar(p['nombre del líder'] || p['líder'] || p.lider || ''), tipo: cap([p.tipo1, p.tipo2].filter(Boolean).join('/')), medalla: wkLimpiar(p.medalla || ''), numero: wkLimpiar(p.numero || p['número'] || ''), ubic: wkLimpiar(p['ubicación'] || p.ubicacion || '') };
}
async function wkZona(nombre, conGym = true) {
  const clave = 'z4:' + nombre + (conGym ? '' : ':s');
  if (WK.mem[clave]) return WK.mem[clave];
  const guardado = wkCache(clave, 12); if (guardado) return (WK.mem[clave] = guardado);
  const POK = await wkPokes();
  const j = await wkApi('action=parse&prop=wikitext&redirects=1&page=' + encodeURIComponent(WK.paginas[nombre] || nombre));
  if (!j.parse) throw new Error('La wiki todavía no tiene una página para esta zona.');
  const wt = j.parse.wikitext['*'], pl = wkPlantilla(wt), info = {};
  const nombres = { lugares: 'Conexiones', conexiones: 'Conexiones', mos: 'MO necesarias', clima: 'Clima', ambiente: 'Ambiente', 'ubicación': 'Ubicación' };
  if (pl) Object.entries(pl.params).forEach(([k, v]) => {
    const nk = nombres[k]; if (!nk || info[nk]) return;
    const val = wkLimpiar(String(v).replace(/<br\s*\/?>/gi, ' · ')).replace(/\b(Norte|Sur|Este|Oeste):?\s*(?=·|$)/g, '').replace(/(\s*·\s*)+/g, ' · ').replace(/^\s*·\s*|\s*·\s*$/g, '');
    if (val && !/^ninguna?$/i.test(val)) info[nk] = val.slice(0, 200);
  });
  const secs = wkSecciones(wt);
  const d = {
    titulo: j.parse.title, url: wkUrl(j.parse.title), info,
    poke: wkSalvajes(wt, POK),
    objetos: secs.filter(s => /^objetos/i.test(s.titulo)).flatMap(s => wkTablaObjetos(s.texto, POK)).slice(0, 40),
    interes: secs.filter(s => /inter[eé]s|lugares|edificios/i.test(s.titulo)).flatMap(s => s.texto.split('\n').filter(l => /^\*/.test(l)).map(l => wkLimpiar(l.replace(/^\*+/, '')).slice(0, 160))).filter(Boolean).slice(0, 16),
    gym: null
  };
  if (conGym) {
    try { const g = await wkGimnasio(wt); if (g && g.ubic && (wkNorm(g.ubic).includes(wkNorm(nombre)) || wkNorm(nombre).includes(wkNorm(g.ubic)) || wkNorm(g.ubic) === wkNorm(d.titulo))) d.gym = g; } catch (e) { d.gymFallo = true; }
  }
  // Si el gimnasio no se pudo traer (red cortada, cambio de página), se muestra igual pero no se guarda: la próxima vez se reintenta.
  if (d.gymFallo) return d;
  wkCache(clave, 0, d);
  return (WK.mem[clave] = d);
}
function wkEstado(t) {
  const lg = (t.estado === 'Controlada' || t.estado === 'En disputa') && t.equipo ? emblema(t.equipo) : null;
  const txt = t.estado === 'Controlada' ? t.equipo : t.estado === 'En disputa' ? 'En disputa' + (t.equipo ? ' · ' + t.equipo : '') : (t.estado || 'Neutral');
  return { lg, txt, c: t.estado === 'Controlada' || t.estado === 'En disputa' ? colorZona(t) : '#93b9c3' };
}
function renderWiki() {
  const g = $('#gridWiki'); if (!g) return;
  const zonas = wkZonas(), grupo = WK.grupos.find(x => x.id === WK.filtro) || WK.grupos[0], q = wkNorm(WK.q);
  $('#filtrosWiki').innerHTML = WK.grupos.map(x => { const n = x.re ? zonas.filter(z => x.re.test(z.tipo)).length : zonas.length; return `<button type="button" class="chip" data-act="wiki-filtro" data-f="${x.id}" aria-pressed="${x.id === WK.filtro}">${esc(x.l)}<b>${n}</b></button>`; }).join('');
  const vis = zonas.filter(z => (!grupo.re || grupo.re.test(z.tipo)) && (!q || wkNorm(z.nombre + ' ' + z.tipo + ' ' + z.equipo + ' ' + wkTexto(z.nombre).resumen).includes(q)));
  g.innerHTML = vis.map(z => {
    const e = wkEstado(z), w = wkTexto(z.nombre);
    return `<${MULTIPAGINA ? `a href="/wiki/${wkSlug(z.nombre)}.html"` : 'button type="button" data-act="wiki"'} class="wk-card" data-zona="${esc(z.nombre)}" style="--c:${esc(e.c)}"><span class="wk-card-cab"><b>${esc(z.nombre)}</b><small>${esc(z.tipo)}</small></span><span class="wk-card-res">${esc(w.resumen || 'Abrí la ficha para ver los datos de la wiki.')}</span><span class="wk-card-est">${e.lg ? `<span class="mini">${imgEmblema(e.lg)}</span>` : '<span class="mini punto"></span>'}${esc(e.txt)}</span></${MULTIPAGINA ? 'a' : 'button'}>`;
  }).join('');
  $('#wikiVacio').hidden = vis.length > 0 || !!$('#wikiPoke:not([hidden])');
}
function wkVivoHTML(v) {
  const filas = Object.entries(v.info);
  const grupos = []; v.poke.forEach(x => { let g = grupos.find(y => y.m === x.m); if (!g) grupos.push(g = { m: x.m, l: [] }); g.l.push(x); });
  const tabla = l => { const col = k => l.some(x => x[k]); return `<div style="overflow-x:auto"><table class="wk-tabla"><thead><tr><th>Pokémon</th>${col('niv') ? '<th>Nivel</th>' : ''}${col('prob') ? '<th>Prob.</th>' : ''}${col('hor') ? '<th>Horario</th>' : ''}</tr></thead><tbody>${l.map(x => `<tr><td>${pkA(x.n)}${x.nota ? `<br><small>${esc(x.nota)}</small>` : ''}</td>${col('niv') ? `<td>${esc(x.niv)}</td>` : ''}${col('prob') ? `<td>${esc(x.prob)}</td>` : ''}${col('hor') ? `<td>${esc(x.hor)}</td>` : ''}</tr>`).join('')}</tbody></table></div>`; };
  const tienda = v.objetos.filter(o => /comprar|tienda/i.test(o.d)), enc = v.objetos.filter(o => !/comprar|tienda/i.test(o.d));
  const lista = l => `<ul class="wk-lista">${l.map(o => `<li>${esc(o.n)}${o.d ? ` <small>· ${esc(o.d)}</small>` : ''}</li>`).join('')}</ul>`;
  return `${filas.length ? `<div><h3>Ficha</h3><dl class="ficha">${filas.map(([k, x]) => `<div><dt>${esc(k)}</dt><dd>${esc(x)}</dd></div>`).join('')}</dl></div>` : ''}
    ${v.gym ? `<div><h3>Gimnasio</h3><div class="wk-gym">${v.gym.numero ? `<div><small>N.°</small><b>${esc(v.gym.numero)}</b></div>` : ''}<div><small>Líder</small><b>${esc(v.gym.lider || '—')}</b></div><div><small>Tipo</small><b>${esc(v.gym.tipo || '—')}</b></div><div><small>Medalla</small><b>${esc(v.gym.medalla || '—')}</b></div></div></div>` : ''}
    <div><h3>Pokémon salvajes</h3>${grupos.length ? grupos.map(g => `${g.m ? `<p class="wk-metodo">${esc(g.m)}</p>` : ''}${tabla(g.l)}`).join('') : '<p class="muted">La wiki no lista Pokémon salvajes para esta zona.</p>'}</div>
    ${enc.length || tienda.length ? `<div><h3>Objetos</h3>${enc.length ? lista(enc) : ''}${tienda.length ? `<details><summary>En la tienda (${tienda.length})</summary>${lista(tienda)}</details>` : ''}</div>` : ''}
    ${v.interes.length ? `<div><h3>Lugares de interés</h3><ul class="wk-lista">${v.interes.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}`;
}
function articuloWikiHTML(zona, enPagina) {
  const t = wkZonas().find(x => x.nombre === zona) || { nombre: zona, tipo: '', estado: 'Neutral' };
  const w = wkTexto(zona), e = wkEstado(t), url = esc(wkUrl(WK.paginas[zona] || zona));
  return `<div class="wk-art">
      <div class="wk-control" style="--c:${esc(e.c)}">${e.lg ? `<span class="mini">${imgEmblema(e.lg)}</span>` : '<span class="mini punto"></span>'}<span>${t.estado === 'Controlada' ? 'Controlada por <b>' + esc(t.equipo) + '</b>' : '<b>' + esc(e.txt) + '</b>'} en la guerra de teams</span>
        <span class="acc">${t.id && S.d.territorios.some(x => x.id === t.id) ? `<button class="btn sm" type="button" data-act="wiki-a-zona" data-id="${esc(t.id)}">Ver en el atlas</button>` : ''}<a class="btn sm" data-wk-original href="${url}" target="_blank" rel="noopener">Wiki original ↗</a>${esAdmin() ? `<button class="btn sm sand" type="button" data-act="wiki-editar" data-zona="${esc(zona)}">Editar resumen</button>` : ''}</span></div>
      ${w.resumen ? `<p class="wk-resumen">${esc(w.resumen)}</p>` : ''}
      ${w.notas ? `<div class="wk-notas"><b>En Reloaded Online</b>${esc(w.notas)}</div>` : ''}
      <div class="wk-art" data-wk-vivo><p class="wk-cargando"><i></i>Trayendo los datos de la wiki…</p></div>
      <p class="wk-pie">Datos de Pokémon, gimnasio, objetos y conexiones: <a data-wk-fuente href="${url}" target="_blank" rel="noopener">Wiki PokemonReloaded</a>, hecha por su comunidad de editores (licencia CC BY-SA). El resumen es de esta web.</p>
    </div>`;
}
async function llenarWikiVivo(caja, zona, sigue) {
  try {
    const v = await wkZona(zona);
    if (!sigue()) return;
    $('[data-wk-vivo]', caja).innerHTML = wkVivoHTML(v);
    $$('[data-wk-original],[data-wk-fuente]', caja).forEach(a => { a.href = v.url; });
  } catch (err) {
    if (!sigue()) return;
    $('[data-wk-vivo]', caja).innerHTML = `<div class="wk-error">No se pudieron traer los datos de la wiki: ${esc(err.message)} <button class="link" type="button" data-act="wiki" data-zona="${esc(zona)}">Reintentar</button></div>`;
  }
}
async function abrirWiki(zona, desdeRuta) {
  const caja = $('#wikiArticulo');
  if (caja && caja.dataset.zona === zona) { pintarWikiPagina(true); return; }
  if (MULTIPAGINA) { const u = '/wiki/' + wkSlug(zona) + '.html'; if (desdeRuta) location.replace(u); else location.href = u; return; }
  cerrar($('#dlgPoke'));
  const d = $('#dlgWiki'), t = wkZonas().find(x => x.nombre === zona) || { tipo: '' };
  d.dataset.zona = zona;
  if (!desdeRuta) history.replaceState(null, '', '#wiki/' + wkSlug(zona));
  d.innerHTML = `<div class="dlg"><div class="dlg-cab"><p class="muted">Wiki · ${esc(t.tipo || 'Región Star')}</p><h2>${esc(zona)}</h2><button class="x" type="button" data-cerrar aria-label="Cerrar">✕</button></div><div class="dlg-cuerpo">${articuloWikiHTML(zona, false)}</div></div>`;
  abrir(d);
  llenarWikiVivo(d, zona, () => d.open && d.dataset.zona === zona);
}
/** Página propia de una zona (wiki/<zona>.html): el artículo va en la página, no en un diálogo. */
function pintarWikiPagina(forzar) {
  const caja = $('#wikiArticulo'); if (!caja) return;
  const zona = caja.dataset.zona, firma = JSON.stringify([wkTexto(zona), (wkZonas().find(x => x.nombre === zona) || {}).estado, (wkZonas().find(x => x.nombre === zona) || {}).equipo, esAdmin()]);
  if (!forzar && caja.dataset.firma === firma) return;
  caja.dataset.firma = firma;
  caja.innerHTML = articuloWikiHTML(zona, true);
  llenarWikiVivo(caja, zona, () => caja.dataset.firma === firma);
}
function formWiki(zona) {
  const w = wkTexto(zona);
  formulario({
    titulo: 'Wiki · ' + zona, texto: 'El resumen aparece arriba de los datos de la wiki. Las notas sirven para lo propio del online: eventos, cambios, consejos de la comunidad.', boton: 'Guardar',
    campos: [{ n: 'resumen', l: 'Resumen', t: 'textarea', v: w.resumen, max: 1200, ancho: true }, { n: 'notas', l: 'Notas de Reloaded Online (opcional)', t: 'textarea', v: w.notas, max: 1500, ancho: true, ph: 'Ej.: en el online esta zona es punto de encuentro para los torneos.' }],
    enviar: async v => { await accion('wikiGuardar', { zona, resumen: v.resumen, notas: v.notas }, 'Wiki actualizada'); if ($('#wikiArticulo')) pintarWikiPagina(true); else abrirWiki(zona, true); }
  });
}
const WK_METODOS = { hierba: 'En la hierba', surf: 'Surfeando', caminar: 'Caminando', especial: 'Especial', pesca: 'Pescando', pescar: 'Pescando', 'caña vieja': 'Caña Vieja', 'caña buena': 'Caña Buena', supercaña: 'Super Caña', 'super caña': 'Super Caña', cueva: 'En cueva', evento: 'Evento', intercambio: 'Intercambio', huevo: 'Huevo', arena: 'En la arena', agua: 'En el agua', barro: 'En el barro', nieve: 'En la nieve' };
async function wkLocalizacion(nombre) {
  const guardado = wkCache('loc:' + nombre, 12); if (guardado) return guardado;
  const j = await wkApi('action=parse&prop=wikitext&redirects=1&page=' + encodeURIComponent(nombre));
  if (!j.parse) return null;
  const items = wkLocItems(j.parse.wikitext['*']);
  return wkCache('loc:' + nombre, 0, { titulo: j.parse.title, items });
}
async function wkBuscarPokemon(nombre) {
  const caja = $('#wikiPoke'), id = ++WK.busq;
  caja.hidden = false;
  caja.innerHTML = `<h3>¿Dónde aparece ${esc(nombre)}?</h3><p class="wk-cargando"><i></i>Buscando en las rutas y lugares de la wiki…</p>`;
  let r = [], loc = null;
  await Promise.all([wkDonde(nombre).then(x => { r = x; }).catch(() => { }), wkLocalizacion(nombre).then(x => { loc = x; }).catch(() => { })]);
  if (id !== WK.busq) return;
  const ficha = loc && loc.items.length ? `<p style="margin:0 0 6px"><b>Según su ficha en la wiki:</b></p><ul class="wk-lista" style="columns:1;margin-bottom:12px">${loc.items.map(x => `<li>${x.m ? `<b>${esc(x.m)}:</b> ` : ''}${wkEnlazar(x.t)}</li>`).join('')}</ul>` : '';
  caja.innerHTML = `<h3>¿Dónde aparece ${esc(nombre)}?</h3>${ficha}${r.length ? `<p>Según las rutas y lugares de la wiki, aparece en ${r.length} ${r.length === 1 ? 'lugar' : 'lugares'}:</p>${dondeHTML(r)}` : `<p>${ficha ? 'No figura en las tablas de encuentros de las rutas y lugares de la wiki.' : 'La wiki todavía no tiene datos de dónde encontrarlo.'}</p>`}<p style="margin:10px 0 0">${pkA(nombre, 'Ver la ficha completa de ' + nombre)}</p>`;
}
let wkTimer = 0;
async function wkAlEscribir() {
  WK.q = $('#buscarWiki').value.trim(); renderWiki();
  const q = wkNorm(WK.q), caja = $('#wikiPoke');
  if (q.length < 3) { caja.hidden = true; WK.busq++; renderWiki(); return; }
  let POK; try { POK = await wkPokes(); } catch (e) { return; }
  const todos = [...POK], exacto = todos.find(n => wkNorm(n) === q), pref = todos.filter(n => wkNorm(n).startsWith(q));
  const elegido = exacto || (pref.length === 1 && q.length >= 4 ? pref[0] : null);
  if (elegido) { WK.q = ''; renderWiki(); wkBuscarPokemon(elegido); }
  else { caja.hidden = true; WK.busq++; renderWiki(); }
}
(() => {
  const b = $('#buscarWiki'); if (!b) return;
  b.addEventListener('input', () => { clearTimeout(wkTimer); wkTimer = setTimeout(wkAlEscribir, 350); });
  b.addEventListener('focus', () => { wkPokes().catch(() => { }); }, { once: true });
  $('#dlgWiki').addEventListener('close', () => { if (/^#wiki\//.test(location.hash)) history.replaceState(null, '', location.pathname + location.search); });
})();
const rutaWiki = () => { const m = location.hash.match(/^#wiki\/([\w-]+)/); if (!m) return; const z = wkZonas().find(x => wkSlug(x.nombre) === m[1]); if (z) abrirWiki(z.nombre, true); };
window.addEventListener('hashchange', rutaWiki);

// ---------- Enciclopedia: Pokédex, legendarios, gimnasios, objetos y guías (en vivo de la Wiki PokemonReloaded) ----------
const pkSlug = s => wkSlug(String(s || '').replace(/♀/g, ' f').replace(/♂/g, ' m'));
const pkHref = n => MULTIPAGINA ? '/pokemon/' + pkSlug(n) + '.html' : '#pokemon/' + pkSlug(n);
const pkA = (n, txt) => `<a class="pk-a" href="${pkHref(n)}" data-poke="${esc(n)}">${esc(txt || n)}</a>`;
const wkClave = s => wkNorm(s).replace(/♀/g, 'f').replace(/♂/g, 'm').replace(/[^a-z0-9]/g, '');
const wkTipo = s => { const n = wkNorm(wkLimpiar(s)); if (!n) return ''; if (n === 'insecto') return 'Bicho'; return Object.keys(COLOR_TIPO).find(k => wkNorm(k) === n) || ''; };
const zonaConocida = n => wkZonas().find(z => wkNorm(z.nombre) === wkNorm(n));
const zonaA = n => { const z = zonaConocida(n); return z ? `<a class="zn-a" href="${MULTIPAGINA ? '/wiki/' + wkSlug(z.nombre) + '.html' : '#wiki/' + wkSlug(z.nombre)}">${esc(n)}</a>` : esc(n); };
/** Texto de la wiki con los nombres de zonas del atlas convertidos en links. */
function wkEnlazar(t) {
  const zs = wkZonas().map(z => z.nombre);
  if (WK.reN !== zs.length) { WK.reN = zs.length; WK.reZ = new RegExp('(?<![\\wÀ-ÿ])(' + zs.slice().sort((a, b) => b.length - a.length).map(z => esc(z).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).concat('Ruta \\d+').join('|') + ')(?![\\wÀ-ÿ])', 'gi'); }
  return esc(t).replace(WK.reZ, m => lugarA(m.replace(/&#39;/g, "'").replace(/&amp;/g, '&')));
}
// Tablas de la wiki: filas y celdas (sin los atributos de estilo)
const wkFilas = t => t.split(/\n\|-/);
const wkColsCrudas = f => ('\n' + f).split(/\n\|(?![-}])|\|\|/).slice(1);
const wkSinAttr = c => c.replace(/^\s*[^|[\]\n{}]*=[^|[\]\n{}]*\|(?!\|)/, '');
const wkCols = f => wkColsCrudas(f).map(wkSinAttr);
const wkTablas = wt => wt.match(/\{\|[\s\S]*?\n\|\}/g) || [];
function wkSeccion(wt, re) {
  const hs = [...wt.matchAll(/^(={2,4})\s*(.*?)\s*\1\s*$/gm)];
  const k = hs.findIndex(h => re.test(wkLimpiar(h[2]))); if (k < 0) return '';
  const fin = hs.slice(k + 1).find(h => h[1].length <= hs[k][1].length);
  return wt.slice(hs[k].index + hs[k][0].length, fin ? fin.index : undefined);
}
async function wkCategoria(c) {
  const out = []; let cont = '';
  for (let k = 0; k < 4; k++) {
    const j = await wkApi('action=query&list=categorymembers&cmlimit=500&cmnamespace=0&cmtitle=' + encodeURIComponent('Categoría:' + c) + cont);
    ((j.query && j.query.categorymembers) || []).forEach(m => out.push(m.title));
    if (!j.continue) break; cont = '&cmcontinue=' + encodeURIComponent(j.continue.cmcontinue);
  }
  return out;
}
const wkPagina = async p => { const j = await wkApi('action=parse&prop=wikitext&redirects=1&page=' + encodeURIComponent(p)); return j.parse ? { titulo: j.parse.title, wt: j.parse.wikitext['*'] } : null; };
const wkFallo = (e, carga) => `<div class="wk-error">No se pudieron traer los datos de la wiki: ${esc(e.message)} <button class="link" type="button" data-act="wk-reintentar" data-carga="${carga}">Reintentar</button></div>`;

// ----- Pokédex -----
const GENS = [[1, 151, 'Kanto'], [152, 251, 'Johto'], [252, 386, 'Hoenn'], [387, 493, 'Sinnoh'], [494, 649, 'Teselia'], [650, 721, 'Kalos'], [722, 809, 'Alola'], [810, 905, 'Galar'], [906, 1025, 'Paldea']];
const genDe = n => GENS.findIndex(([a, b]) => n >= a && n <= b) + 1;
const DEX = { q: '', tipo: '', grupo: 'todos', gen: '' };
const DEX_GRUPOS = [{ id: 'todos', l: 'Todos' }, { id: 'leg', l: 'Legendarios y singulares' }, { id: 'exc', l: 'Exclusivos de Reloaded' }, { id: 'forma', l: 'Formas regionales y especiales' }];
async function wkDex() {
  if (WK.dex) return WK.dex;
  const g = wkCache('dex1', 24 * 7); if (g) return (WK.dex = g);
  const [POK, dex] = await Promise.all([wkPokes(), cargarDex()]);
  if (!dex) throw new Error('No se pudo cargar la lista de especies.');
  const idx = new Map(dex.especies.map((e, i) => [wkClave(e[0]), i]));
  const lista = [], extras = [];
  POK.forEach(n => { const i = idx.get(wkClave(n)); if (i != null) { const e = dex.especies[i]; lista.push({ n, num: i + 1, t: [e[1], e[2]].filter(Boolean) }); } else extras.push(n); });
  // Formas regionales, especiales y Pokémon propios de Reloaded: se leen de su ficha (de a 50 por pedido)
  for (let k = 0; k < extras.length; k += 50) {
    const j = await wkApi('action=query&prop=revisions&rvprop=content&rvslots=main&rvsection=0&titles=' + encodeURIComponent(extras.slice(k, k + 50).join('|')));
    Object.values((j.query && j.query.pages) || {}).forEach(p => {
      const r = p.revisions && p.revisions[0], w = r ? ((r.slots && r.slots.main && r.slots.main['*']) || r['*'] || '') : '';
      const i = w.search(/\{\{\s*Pok[eé]mon\s*(\n|\|)/i), pl = wkPlantilla(i >= 0 ? w.slice(i) : w), q = pl ? pl.params : {};
      const nr = wkLimpiar(q['número'] || q.numero || ''), m = nr.match(/\d+/);
      if (!m) {
        // Formas especiales sin número propio (Mega Raichu X, Dialga Primario, Lugia Dark…): van con su especie base
        if (/^(c[eé]lula|n[uú]cleo|localizaci|lista|forma |pok[eé]mon )/i.test(p.title)) return;
        const b = p.title.split(/\s+/).map(x => idx.get(wkClave(x))).find(x => x != null); if (b == null) return;
        const e = dex.especies[b], tq = [wkTipo(q.tipo1), wkTipo(q.tipo2)].filter(Boolean);
        lista.push({ n: p.title, num: b + 1, forma: 1, t: tq.length ? tq : [e[1], e[2]].filter(Boolean) });
        return;
      }
      lista.push({ n: p.title, num: +m[0], forma: /\d\s*-\s*\d/.test(nr) || / de (Alola|Galar|Hisui|Paldea)$/i.test(p.title) ? 1 : 0, exc: /^s[ií]/i.test(wkLimpiar(q.exclusivo || '')) ? 1 : 0, t: [wkTipo(q.tipo1), wkTipo(q.tipo2)].filter(Boolean) });
    });
  }
  const cat = c => wkCategoria(c).catch(() => []);
  const [leg, exc] = await Promise.all([cat('Pokémon legendarios'), cat('Pokémon Exclusivos')]);
  const L = new Set(leg.map(wkClave)), X = new Set(exc.map(wkClave));
  lista.forEach(p => { if (L.has(wkClave(p.n))) p.leg = 1; if (X.has(wkClave(p.n)) || p.num > 1025) p.exc = 1; });
  lista.sort((a, b) => a.num - b.num || (a.forma || 0) - (b.forma || 0) || a.n.localeCompare(b.n, 'es'));
  return (WK.dex = wkCache('dex1', 0, lista));
}
async function pintarDex() {
  const g = $('#gridDex'); if (!g) return;
  try { await wkDex(); } catch (e) { g.innerHTML = wkFallo(e, 'dex'); return; }
  renderDex();
}
function renderDex() {
  const g = $('#gridDex'); if (!g || !WK.dex) return;
  const q = wkNorm(DEX.q).replace(/^#/, ''), num = /^\d+$/.test(q) ? +q : 0;
  const vis = WK.dex.filter(p => (DEX.grupo === 'todos' || p[DEX.grupo]) && (!DEX.tipo || p.t.includes(DEX.tipo)) && (!DEX.gen || genDe(p.num) === +DEX.gen) && (!q || (num ? p.num === num : wkNorm(p.n).includes(q))));
  $('#filtrosDex').innerHTML = DEX_GRUPOS.map(x => `<button type="button" class="chip" data-act="dex-grupo" data-f="${x.id}" aria-pressed="${x.id === DEX.grupo}">${esc(x.l)}<b>${x.id === 'todos' ? WK.dex.length : WK.dex.filter(p => p[x.id]).length}</b></button>`).join('');
  $('#cuentaDex').textContent = vis.length === WK.dex.length ? WK.dex.length + ' Pokémon en Reloaded. Tocá uno para ver su ficha.' : 'Mostrando ' + vis.length + ' de ' + WK.dex.length + ' Pokémon.';
  g.innerHTML = vis.length ? vis.map(p => `<a class="dex-c" href="${pkHref(p.n)}" data-poke="${esc(p.n)}" style="--c:${COLOR_TIPO[p.t[0]] || '#3d9ab8'}"><small>#${String(p.num).padStart(3, '0')}${p.forma ? ' · forma' : ''}</small><b>${esc(p.n)}</b><span class="dex-t">${p.t.map(tipoChip).join('')}${p.exc ? '<span class="pk-exc">Reloaded</span>' : ''}</span></a>`).join('') : '<p class="vacio">Ningún Pokémon coincide con la búsqueda.</p>';
}

// ----- Ficha de un Pokémon -----
function wkStats(wt) {
  const i = wt.search(/\{\{\s*Estad[ií]sticas\s+Pok[eé]mon/i); if (i < 0) return null;
  const pl = wkPlantilla(wt.slice(i)); if (!pl) return null;
  const p = pl.params, n = k => parseInt(String(p[k] || '').replace(/\D/g, ''), 10) || 0;
  const s = [['PS', n('ps')], ['Ataque', n('ataque')], ['Defensa', n('defensa')], ['At. Esp.', n('ataque especial')], ['Def. Esp.', n('defensa especial')], ['Velocidad', n('velocidad')]];
  return s.some(x => x[1]) ? s : null;
}
function wkEvolucion(tabla) {
  const filas = [];
  wkFilas(tabla.replace(/^\{\|[^\n]*/, '').replace(/\n\|\}[\s\S]*$/, '')).forEach(f => {
    const fila = [];
    wkColsCrudas(f).forEach(c => {
      if (/^\s*[^|[\]\n]*class\s*=\s*"?flecha/i.test(c)) { fila.push({ c: wkLimpiar(wkSinAttr(c)) || 'Evoluciona' }); return; }
      const tx = wkSinAttr(c), ls = wkLinks(tx), n = (ls.length ? ls[ls.length - 1] : wkLimpiar(tx)).trim();
      if (n && n.length < 40) fila.push({ p: n });
    });
    if (fila.some(x => x.p)) filas.push(fila);
  });
  return filas;
}
function wkLocItems(wt) {
  const s = wkSecciones(wt).find(x => /locali/i.test(x.titulo)); let items = [];
  if (!s) return items;
  const i = s.texto.search(/\{\{\s*Localizaci[oó]n/i);
  if (i >= 0) { const pl = wkPlantilla(s.texto.slice(i)); if (pl) items = Object.entries(pl.params).map(([k, v]) => ({ m: WK_METODOS[k] || (k.charAt(0).toUpperCase() + k.slice(1)), t: wkLimpiar(v).slice(0, 300) })).filter(x => x.t); }
  if (!items.length) { const tx = wkLimpiar(s.texto).slice(0, 300); if (tx && !/rutas siguientes:?$/i.test(tx)) items = [{ m: '', t: tx + (tx.length >= 300 ? '…' : '') }]; }
  return items;
}
function wkMovimientos(txt) {
  const tb = txt.match(/<tabber>([\s\S]*?)<\/tabber>/i), grupos = [];
  (tb ? tb[1].split(/\n\|-\|[^\n]*/) : [txt]).forEach(p => {
    const m = p.match(/^\s*([^\n={}|]{1,40}?)\s*=\s*$/m), nombre = (m ? m[1] : 'Movimientos').replace(/\.\s*$/, '').trim(), l = [];
    wkTablas(p).forEach(t => wkFilas(t).forEach(f => {
      const ls = wkLinks(f).filter(x => !/^(MT|MO|DT|TM|HM)\s*\d/i.test(x) && !/^(Tipo|Categor)/i.test(x)); if (!ls.length) return;
      const tt = [...f.matchAll(/\{\{\s*t\s*\|\s*([^}|]+?)\s*\}\}/gi)].map(x => x[1]), mov = wkLimpiar('[[' + ls[0] + ']]');
      const x = wkCols(f).map(c => wkLimpiar(c)).filter(Boolean).find(c => c !== mov && !/^(f[ií]sico|especial|estado)$/i.test(c) && !wkTipo(c)) || '';
      l.push({ m: mov, x: x.slice(0, 16), t: wkTipo(tt[0] || ''), c: wkLimpiar(tt[1] || '').replace(/^./, s => s.toUpperCase()) });
    }));
    if (l.length) grupos.push({ n: nombre, l });
  });
  return grupos;
}
async function wkPokemon(nombre) {
  const k = 'pk1:' + nombre;
  if (WK.mem[k]) return WK.mem[k];
  const g = wkCache(k, 12); if (g) return (WK.mem[k] = g);
  const pg = await wkPagina(nombre);
  if (!pg) throw new Error('La wiki todavía no tiene ficha de ' + nombre + '.');
  const wt = pg.wt, i = wt.search(/\{\{\s*Pok[eé]mon\s*(\n|\|)/i), pl = wkPlantilla(i >= 0 ? wt.slice(i) : wt), q = pl ? pl.params : {};
  const L = s => wkLimpiar(s || ''), hay = x => x && !/^(ningun[oa]?|no|-|—)$/i.test(x), ev = wt.match(/\{\|[^\n]*class\s*=\s*"?evolucion[\s\S]*?\n\|\}/i);
  const d = {
    n: pg.titulo, url: wkUrl(pg.titulo), num: L(q['número'] || q.numero), especie: L(q.especie), tipos: [wkTipo(q.tipo1), wkTipo(q.tipo2)].filter(Boolean),
    hab: [L(q.habilidad), L(q.habilidad2)].filter(hay), oculta: [L(q.habilidado || q['habilidad oculta'] || q.habilidadoculta)].filter(hay)[0] || '',
    peso: L(q.peso), altura: L(q.altura), huevo: [L(q.grupo1), L(q.grupo2)].filter(hay), exc: /^s[ií]/i.test(L(q.exclusivo)),
    stats: wkStats(wt), evo: ev ? wkEvolucion(ev[0]) : [], loc: wkLocItems(wt), movs: wkMovimientos(wkSeccion(wt, /^movimientos/i))
  };
  return (WK.mem[k] = wkCache(k, 0, d));
}
function fichaPokemonHTML(p, enPagina) {
  const tot = p.stats ? p.stats.reduce((a, x) => a + x[1], 0) : 0, num = p.num ? '#' + String(p.num).replace(/^0+(?=\d)/, '') : '';
  const sec = (t, h) => h ? `<section class="pk-sec"><h3>${t}</h3>${h}</section>` : '';
  const yo = wkClave(p.n);
  const evo = p.evo.map(f => `<div class="pk-evo">${f.map(x => x.p ? (wkClave(x.p) === yo ? `<b>${esc(x.p)}</b>` : pkA(x.p)) : `<span class="pk-flecha">${esc(x.c)}</span>`).join('')}</div>`).join('');
  const stats = p.stats ? `<div class="pk-stats">${p.stats.map(([k, v]) => `<div><span>${k}</span><b>${v}</b><i style="--v:${Math.min(100, Math.round(v / 1.8))}%;--b:${v >= 100 ? '#7ac74c' : v >= 70 ? '#f4d38b' : '#ee8130'}"></i></div>`).join('')}<div class="pk-tot"><span>Total</span><b>${tot}</b></div></div>` : '';
  const datos = [['Habilidades', p.hab.length ? p.hab.map(habA).join(' · ') : '—', 1], p.oculta && ['Habilidad oculta', habA(p.oculta), 1], p.huevo.length && ['Grupo huevo', p.huevo.join(' · ')], p.peso && ['Peso', p.peso.replace(/\s*kg\.?$/i, '') + ' kg'], p.altura && ['Altura', p.altura.replace(/\s*m\.?$/i, '') + ' m']].filter(Boolean);
  const loc = `<div data-locl></div>` + (p.loc.length ? `<ul class="wk-lista" style="columns:1" data-loc-ficha>${p.loc.map(x => `<li>${x.m ? `<b>${esc(x.m)}:</b> ` : ''}${wkEnlazar(x.t)}</li>`).join('')}</ul>` : '<p class="muted">La wiki todavía no dice dónde encontrarlo.</p>')
    + `<div class="pk-zonas" data-donde="${esc(p.n)}"></div>`;
  const movs = p.movs.length ? `<div class="chips pk-tabs">${p.movs.map((g, i) => `<button type="button" class="chip" data-act="pk-tab" data-i="${i}" aria-pressed="${i === 0}">${esc(g.n)}<b>${g.l.length}</b></button>`).join('')}</div>`
    + p.movs.map((g, i) => { const col = /nivel/i.test(g.n) ? 'Nv.' : /m[to]|dt/i.test(g.n) ? 'N.°' : '', cx = col && g.l.some(x => x.x); return `<div class="pk-movs" data-i="${i}"${i ? ' hidden' : ''}><div style="overflow-x:auto"><table class="wk-tabla"><thead><tr>${cx ? `<th>${col}</th>` : ''}<th>Movimiento</th><th>Tipo</th><th>Categoría</th></tr></thead><tbody>${g.l.map(x => `<tr>${cx ? `<td>${esc(x.x)}</td>` : ''}<td>${esc(x.m)}</td><td>${tipoChip(x.t)}</td><td>${esc(x.c)}</td></tr>`).join('')}</tbody></table></div></div>`; }).join('') : '';
  const cuerpo = `<dl class="ficha">${datos.map(([k, v, html]) => `<div><dt>${k}</dt><dd>${html ? v : esc(v)}</dd></div>`).join('')}</dl>
      ${sec('Estadísticas base', stats)}${p.tipos.length ? sec('Debilidades y resistencias', debilidadesHTML(p.tipos)) : ''}${sec('Evolución', evo)}${sec('Dónde encontrarlo', loc)}${sec('Movimientos', movs)}
      <p class="wk-pie">Datos de la <a href="${esc(p.url)}" target="_blank" rel="noopener">ficha de ${esc(p.n)} en la Wiki PokemonReloaded ↗</a>, hecha por su comunidad de editores (licencia CC BY-SA).${MULTIPAGINA && !enPagina ? ` · <a href="${pkHref(p.n)}">Página de ${esc(p.n)} en esta web</a>` : ''}</p>`;
  if (enPagina) return cuerpo;
  return `<div class="dlg" style="--c:${COLOR_TIPO[p.tipos[0]] || '#1a5d74'}"><div class="dlg-cab"><p class="muted">${esc([num, p.especie && 'Pokémon ' + p.especie].filter(Boolean).join(' · ') || 'Pokédex de Reloaded')}</p><h2>${esc(p.n)}</h2><p class="pk-tipos">${p.tipos.map(tipoChip).join('')}${p.exc ? '<span class="pk-exc">Exclusivo de Reloaded</span>' : ''}</p><button class="x" type="button" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="dlg-cuerpo pk-cuerpo">${cuerpo}</div></div>`;
}
/** Página propia de un Pokémon (pokemon/<nombre>.html): el texto básico ya viene en el HTML y la ficha completa se completa en vivo. */
async function pintarPokemonPagina(caja) {
  const n = caja.dataset.n, fijo = $('.pk-locl', caja), fijoHTML = fijo ? fijo.outerHTML : '';
  try {
    let p = await wkPokemon(n);
    // Si la ficha en vivo viene con menos datos que la página, se queda lo que ya teníamos
    if (!p.hab.length && caja.dataset.hab) p = Object.assign({}, p, { hab: caja.dataset.hab.split('|'), oculta: p.oculta || caja.dataset.oc || '' });
    caja.innerHTML = fichaPokemonHTML(p, true);
    const dz = $('[data-donde]', caja); if (dz) pkDonde(p.n, dz);
    const dl = $('[data-locl]', caja);
    if (dl && fijoHTML) { dl.innerHTML = fijoHTML; const v = $('[data-loc-ficha]', caja); if (v) v.hidden = true; const m = dl.parentNode.querySelector(':scope > p.muted'); if (m) m.hidden = true; }
    if (dl) pkLocLista(p, dl);
  } catch (e) {
    const c = $('[data-pk-cargando]', caja); if (c) c.outerHTML = `<div class="wk-error">No se pudo traer la ficha completa de la wiki: ${esc(e.message)}. Lo de arriba es lo que ya sabemos de ${esc(n)}.</div>`;
  }
}
async function abrirPokemon(nombre, desdeRuta) {
  const d = $('#dlgPoke'); d.dataset.n = nombre;
  if (!desdeRuta) history.replaceState(null, '', '#pokemon/' + pkSlug(nombre));
  d.innerHTML = `<div class="dlg"><div class="dlg-cab"><p class="muted">Pokédex de Reloaded</p><h2>${esc(nombre)}</h2><button class="x" type="button" data-cerrar aria-label="Cerrar">✕</button></div><div class="dlg-cuerpo"><p class="wk-cargando"><i></i>Trayendo la ficha de la wiki…</p></div></div>`;
  abrir(d);
  try {
    const p = await wkPokemon(nombre);
    if (d.dataset.n === nombre && d.open) { d.innerHTML = fichaPokemonHTML(p); const dz = $('[data-donde]', d); if (dz) pkDonde(p.n, dz); const dl = $('[data-locl]', d); if (dl) pkLocLista(p, dl); }
  } catch (e) {
    if (d.dataset.n === nombre && d.open) $('.dlg-cuerpo', d).innerHTML = `<div class="wk-error">No se pudo traer la ficha: ${esc(e.message)} <button class="link" type="button" data-act="pk-reintentar" data-n="${esc(nombre)}">Reintentar</button></div><p class="wk-pie" style="margin-top:12px"><a href="${esc(wkUrl(nombre))}" target="_blank" rel="noopener">Buscar ${esc(nombre)} en la Wiki PokemonReloaded ↗</a></p>`;
  }
}
async function rutaPokemon() {
  const m = location.hash.match(/^#pokemon\/([\w-]+)/); if (!m) return;
  let n = null;
  try { n = [...await wkPokes()].find(x => pkSlug(x) === m[1]) || null; } catch (e) { }
  if (!n) n = m[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const d = $('#dlgPoke');
  if (d.open && d.dataset.n === n) return;
  abrirPokemon(n, true);
}
window.addEventListener('hashchange', rutaPokemon);
$('#dlgPoke').addEventListener('close', () => { if (/^#pokemon\//.test(location.hash)) history.replaceState(null, '', location.pathname + location.search); });

// ----- ¿Dónde aparece? Todas las rutas y lugares de la wiki que lo tienen en sus tablas -----
const WK_NO_LUGAR = /^(lista|localizaci[oó]n de|gu[ií]a|pok[eé]mon reloaded:|gimnasio|guarida|cafeter|frente de batalla|laboratorio|centro de|categor)/i;
const WK_LUGAR_RE = /^(ruta|isla|islas|cueva|bosque|monte|lago|playa|calle|zona|torre|pantano|desierto|ruinas|para[ií]so|pueblo|ciudad|puerto|archipi[eé]lago|jungla|la jungla)\b/i;
async function wkLugares() {
  if (WK.lug) return WK.lug;
  const g = wkCache('lug1', 24 * 7); if (g) return (WK.lug = g);
  const cats = ['Rutas', 'Lugares del juego', 'Otros lugares', 'Cuevas', 'Islas', 'Ciudades', 'Pueblos', 'Región Star', 'Islas Cometa', 'Gran Isla Estelar', 'La Jungla', 'Isla Llanos', 'Isla Espíritu', 'Pokemon Salvajes', 'Localizaciones'];
  const l = [...new Set((await Promise.all(cats.map(c => wkCategoria(c).catch(() => [])))).flat())];
  if (!l.length) throw new Error('La wiki no devolvió la lista de lugares.');
  return (WK.lug = wkCache('lug1', 0, l));
}
async function wkDonde(nombre) {
  const k = 'donde1:' + nombre;
  if (WK.mem[k]) return WK.mem[k];
  const g = wkCache(k, 24); if (g) return (WK.mem[k] = g);
  const [POK, lug] = await Promise.all([wkPokes(), wkLugares().catch(() => [])]);
  const L = new Set(lug), bl = []; let cont = '';
  for (let i = 0; i < 4; i++) {
    const j = await wkApi('action=query&list=backlinks&blnamespace=0&bllimit=500&bltitle=' + encodeURIComponent(nombre) + cont);
    ((j.query && j.query.backlinks) || []).forEach(b => bl.push(b.title));
    if (!j.continue) break; cont = '&blcontinue=' + encodeURIComponent(j.continue.blcontinue);
  }
  const cand = [...new Set(bl)].filter(t => !POK.has(t) && !WK_NO_LUGAR.test(t) && (L.has(t) || WK_LUGAR_RE.test(t)));
  const out = [];
  for (let i = 0; i < cand.length && i < 250; i += 50) {
    const j = await wkApi('action=query&prop=revisions&rvprop=content&rvslots=main&titles=' + encodeURIComponent(cand.slice(i, i + 50).join('|')));
    Object.values((j.query && j.query.pages) || {}).forEach(p => {
      const r = p.revisions && p.revisions[0], w = r ? ((r.slots && r.slots.main && r.slots.main['*']) || r['*'] || '') : '';
      const l = wkSalvajes(w, POK).filter(x => wkClave(x.n) === wkClave(nombre));
      if (l.length) out.push({ lugar: p.title, l: l.map(x => ({ m: x.m, niv: x.niv, prob: x.prob, hor: x.hor })) });
    });
  }
  out.sort((a, b) => a.lugar.localeCompare(b.lugar, 'es', { numeric: true }));
  return (WK.mem[k] = wkCache(k, 0, out));
}
/** Link a un lugar: zona del atlas → su página; ruta → la sección Rutas; otro lugar → la wiki. */
const lugarA = n => zonaConocida(n) ? zonaA(n) : /^ruta\b/i.test(n) ? `<a class="zn-a" href="${MULTIPAGINA ? '/wiki/rutas.html' : ''}#r-${wkSlug(n)}">${esc(n)}</a>` : `<a class="zn-a" href="${esc(wkUrl(n))}" target="_blank" rel="noopener">${esc(n)} ↗</a>`;
const dondeHTML = r => `<ul class="pk-donde">${r.map(x => `<li>${lugarA(x.lugar)}<small>${esc(x.l.map(y => [y.m, y.niv && 'Nv. ' + y.niv, y.prob, y.hor].filter(Boolean).join(' · ')).join(' — ') || 'Salvaje')}</small></li>`).join('')}</ul>`;
async function pkDonde(nombre, caja) {
  caja.innerHTML = '<p class="wk-cargando"><i></i>Buscando en las rutas y lugares de la wiki…</p>';
  try {
    const r = await wkDonde(nombre);
    caja.innerHTML = r.length ? `<p class="pk-hall">Según las rutas y lugares de la wiki, aparece en ${r.length} ${r.length === 1 ? 'lugar' : 'lugares'}:</p>${dondeHTML(r)}` : '<p class="muted">No figura en las tablas de encuentros de las rutas y lugares de la wiki.</p>';
  } catch (e) { caja.innerHTML = `<p class="muted">No se pudieron revisar las rutas: ${esc(e.message)} <button class="link" type="button" data-act="pk-donde" data-n="${esc(nombre)}">Reintentar</button></p>`; }
}


// ----- Listas de localización por generación de la wiki (cubren también lugares sin página propia) -----
const WK_LOC_GEN = ['primera', 'segunda', 'tercera', 'cuarta', 'quinta', 'sexta', 'séptima', 'octava', 'novena'];
const pkForma = n => String(n).replace(/\s*\((Alola|Galar|Hisui|Paldea)\)\s*$/i, ' de $1');
const wkUtil = s => { const x = String(s || '').replace(/\s*Si quieres saber[^.]*\.?/gi, '').trim(); return /^(ning[uú]n lugar|nada|ningun[oa]|-|—|de\s*:\s*ning[uú]n pok[eé]mon)\.?$/i.test(x) ? '' : x; };
async function wkLocLista(num) {
  const g = genDe(num), pag = g ? 'Localización de los Pokémon de la ' + WK_LOC_GEN[g - 1] + ' generación' : 'Localización de los Pokémon exclusivos de la región Star', k = 'locl1:' + pag;
  if (WK.mem[k]) return WK.mem[k];
  const c = wkCache(k, 24 * 3); if (c) return (WK.mem[k] = c);
  const pg = await wkPagina(pag), idx = {};
  if (pg) wkTablas(pg.wt.replace(/^[ \t]+(?=[{|!])/gm, '')).forEach(tb => wkFilas(tb).forEach(f => {
    const cs = wkCols(f); if (cs.length < 3) return;
    const n = wkLinks(cs[0]).pop(); if (!n) return;
    const tx = cs.slice(1, 5).map(x => wkUtil(wkLimpiar(x)));
    if (tx.some(Boolean)) idx[wkClave(pkForma(n))] = { tierra: tx[0] || '', agua: tx[1] || '', evo: (tx[2] || '').replace(/^de\s*:\s*/i, ''), esp: tx[3] || '' };
  }));
  return (WK.mem[k] = wkCache(k, 0, { url: pg ? wkUrl(pg.titulo) : '', idx }));
}
async function pkLocLista(p, caja) {
  const num = parseInt(p.num, 10); if (!num) return;
  try {
    const { url, idx } = await wkLocLista(num), e = idx[wkClave(p.n)];
    if (!e || !caja.isConnected) return;
    const filas = [['Por tierra', e.tierra], ['En el agua', e.agua], ['Evoluciona de', e.evo], ['Especial', e.esp]].filter(x => x[1]);
    caja.innerHTML = `<dl class="pk-locl">${filas.map(([k, v]) => `<div><dt>${k}</dt><dd>${wkEnlazar(v)}</dd></div>`).join('')}</dl><p class="pk-fuente">Según la <a href="${esc(url)}" target="_blank" rel="noopener">lista de localización de la wiki ↗</a>. Abajo, el detalle de cada ruta que tiene página.</p>`;
    const vieja = caja.parentNode && $('[data-loc-ficha]', caja.parentNode); if (vieja) vieja.hidden = true;
    const sin = caja.parentNode && caja.parentNode.querySelector(':scope > p.muted'); if (sin) sin.hidden = true;
  } catch (e) { }
}

// ----- Rutas: qué sale en cada una -----
const RUT = { q: '' };
async function pintarRutas() {
  const el = $('#listaRutas'); if (!el) return;
  try { await wkLugares(); } catch (e) { el.innerHTML = wkFallo(e, 'rutas'); return; }
  WK.rutas = WK.lug.filter(x => /^ruta\b/i.test(x) && !/^rutas$/i.test(x)).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  renderRutas(); abrirRutaHash();
}
function renderRutas() {
  const el = $('#listaRutas'); if (!el || !WK.rutas) return;
  const q = wkNorm(RUT.q), vis = WK.rutas.filter(r => !q || wkNorm(r).includes(q));
  el.innerHTML = vis.length ? vis.map(r => `<details class="ruta" id="r-${wkSlug(r)}" data-ruta="${esc(r)}"><summary><b>${esc(r)}</b><small data-rr>Tocá para ver qué sale</small></summary><div class="ruta-c"></div></details>`).join('') : '<p class="vacio">Ninguna ruta coincide con la búsqueda.</p>';
}
async function llenarRuta(d) {
  if (d.dataset.cargada) return; d.dataset.cargada = '1';
  const c = $('.ruta-c', d); c.innerHTML = '<p class="wk-cargando"><i></i>Trayendo la ruta de la wiki…</p>';
  try {
    const v = await wkZona(d.dataset.ruta, false), n = new Set(v.poke.map(x => x.n)).size;
    c.innerHTML = `<div class="wk-art">${wkVivoHTML(v)}<p class="wk-pie">Datos de <a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.titulo)} en la Wiki PokemonReloaded ↗</a> (licencia CC BY-SA).</p></div>`;
    $('[data-rr]', d).textContent = n ? n + ' Pokémon' : 'La wiki no lista Pokémon salvajes';
  } catch (e) { delete d.dataset.cargada; c.innerHTML = `<div class="wk-error">No se pudo traer la ruta: ${esc(e.message)}</div>`; }
}
function abrirRutaHash() {
  const m = location.hash.match(/^#(r-[\w-]+)$/); if (!m) return;
  const d = document.getElementById(m[1]); if (!d) return;
  $$('dialog[open]').forEach(cerrar);
  d.open = true; d.scrollIntoView({ block: 'start' });
}
document.addEventListener('toggle', e => { const d = e.target; if (d && d.matches && d.matches('details.ruta') && d.open) llenarRuta(d); }, true);
window.addEventListener('hashchange', abrirRutaHash);

// ----- Legendarios, singulares y ultraentes -----
const LEG = { q: '', g: 'todos' };
function wkTablaLoc(wt) {
  const out = [];
  wkTablas(wt).forEach(t => wkFilas(t).forEach(f => {
    const c = wkCols(f); if (c.length < 3) return;
    const num = (wkLimpiar(c[0]).match(/^\d+/) || [])[0], n = (wkLinks(c[1])[0] || wkLimpiar(c[1])).trim(), loc = wkLimpiar(c.slice(2).join(' '));
    if (num && n && loc) out.push({ num: +num, n, loc: loc.slice(0, 420) });
  }));
  return out;
}
async function wkLegendarios() {
  if (WK.leg) return WK.leg;
  const g = wkCache('leg1', 24); if (g) return (WK.leg = g);
  const partes = await Promise.all([['leg', 'Localización de Pokémon Legendarios y Singulares'], ['ue', 'Localización de Ultraentes']].map(async ([k, p]) => { const pg = await wkPagina(p); return pg ? wkTablaLoc(pg.wt).map(x => Object.assign(x, { g: k })) : []; }));
  const out = partes.flat();
  if (!out.length) throw new Error('La wiki no devolvió la lista de legendarios.');
  return (WK.leg = wkCache('leg1', 0, out));
}
async function pintarLeg() {
  const el = $('#listaLeg'); if (!el) return;
  try { await wkLegendarios(); } catch (e) { el.innerHTML = wkFallo(e, 'leg'); return; }
  renderLeg();
}
function renderLeg() {
  const el = $('#listaLeg'); if (!el || !WK.leg) return;
  const q = wkNorm(LEG.q), vis = WK.leg.filter(x => (LEG.g === 'todos' || x.g === LEG.g) && (!q || wkNorm(x.n + ' ' + x.loc + ' ' + x.num).includes(q)));
  $('#filtrosLeg').innerHTML = [['todos', 'Todos'], ['leg', 'Legendarios y singulares'], ['ue', 'Ultraentes']].map(([id, l]) => `<button type="button" class="chip" data-act="leg-filtro" data-f="${id}" aria-pressed="${id === LEG.g}">${l}<b>${id === 'todos' ? WK.leg.length : WK.leg.filter(x => x.g === id).length}</b></button>`).join('');
  el.innerHTML = vis.length ? vis.map(x => `<article class="leg"><header><small>#${String(x.num).padStart(3, '0')}</small>${pkA(x.n)}${x.g === 'ue' ? '<span class="pk-exc">Ultraente</span>' : ''}</header><p>${wkEnlazar(x.loc)}</p></article>`).join('') : '<p class="vacio">Nada coincide con la búsqueda.</p>';
}

// ----- Gimnasios de la Región Star -----
function wkEquipo(txt) {
  const out = [];
  wkFilas(txt).forEach(f => {
    // Celdas con rowspan = entrenador y diálogos; la del Pokémon trae su imagen y su link. Después vienen nivel (si hay) y movimientos.
    const crudas = wkColsCrudas(f), c = crudas.map(wkSinAttr), libre = k => !/^\s*[^|[\]\n]*rowspan/i.test(crudas[k]);
    const i = c.findIndex((x, k) => libre(k) && /\[\[(?:Archivo|File):[^\]]+\]\][\s\S]*?\[\[(?!Archivo|File)[^\]]+\]\]/i.test(x) && !/^\s*\*/m.test(x));
    if (i < 0) return;
    let niv = '', movs = [];
    c.slice(i + 1, i + 3).forEach((x, k) => {
      if (!libre(i + 1 + k) || movs.length) return;
      const m = !niv && wkLimpiar(x).match(/^\d{1,3}(?=\D{0,3}$)/);
      if (m) niv = m[0];
      else if (/^\s*\*/m.test(x)) movs = x.split('\n').filter(l => /^\s*\*/.test(l)).map(l => wkLimpiar(l.replace(/^\s*\*+/, ''))).filter(Boolean).slice(0, 4);
    });
    const n = wkLinks(c[i]).pop();
    if (n) out.push({ n, niv, movs });
  });
  return out.slice(0, 6);
}
async function wkGimnasios() {
  if (WK.gym) return WK.gym;
  const g = wkCache('gym1', 24); if (g) return (WK.gym = g);
  const titulos = (await wkCategoria('Gimnasios')).filter(t => /^Gimnasio [^\s]+$/.test(t));
  const gyms = (await Promise.all(titulos.map(async t => {
    const pg = await wkPagina(t).catch(() => null); if (!pg) return null;
    const i = pg.wt.search(/\{\{\s*Gimnasio/i), pl = i >= 0 ? wkPlantilla(pg.wt.slice(i)) : null; if (!pl) return null;
    const p = pl.params, secs = wkSecciones(pg.wt), lid = secs.find(s => /l[ií]der/i.test(s.titulo)), obj = secs.find(s => /^objetos/i.test(s.titulo));
    return { titulo: pg.titulo, url: wkUrl(pg.titulo), numero: (wkLimpiar(p.numero || p['número'] || '').match(/\d+/) || [''])[0], lider: wkLimpiar(p['nombre del líder'] || p['líder'] || p.lider || ''), tipos: [wkTipo(p.tipo1), wkTipo(p.tipo2)].filter(Boolean), medalla: wkLimpiar(p.medalla || ''), ubic: wkLimpiar(p['ubicación'] || p.ubicacion || ''), equipo: lid ? wkEquipo(lid.texto) : [], premios: obj ? wkTablaObjetos(obj.texto, new Set()).slice(0, 6) : [] };
  }))).filter(Boolean);
  if (!gyms.length) throw new Error('La wiki no devolvió los gimnasios.');
  gyms.sort((a, b) => (parseInt(a.numero, 10) || 99) - (parseInt(b.numero, 10) || 99));
  return (WK.gym = wkCache('gym1', 0, gyms));
}
async function pintarGym() {
  const el = $('#listaGym'); if (!el) return;
  try { await wkGimnasios(); } catch (e) { el.innerHTML = wkFallo(e, 'gym'); return; }
  el.innerHTML = WK.gym.map(g => `<article class="gym" style="--c:${COLOR_TIPO[g.tipos[0]] || '#3d9ab8'}">
    <header><span class="gym-n">${esc(g.numero || '·')}</span><div><h3>${esc(g.titulo)}</h3><p>${g.ubic ? zonaA(g.ubic) : ''}${g.tipos.map(tipoChip).join('')}</p></div></header>
    <dl class="ficha"><div><dt>Líder</dt><dd>${esc(g.lider || '—')}</dd></div><div><dt>Medalla</dt><dd>${esc(g.medalla || '—')}</dd></div></dl>
    ${g.equipo.length ? `<h4>Equipo del líder</h4><ul class="gym-eq">${g.equipo.map(p => `<li>${pkA(p.n)}${p.niv ? ` <small>Nv. ${esc(p.niv)}</small>` : ''}${p.movs.length ? `<span>${esc(p.movs.join(' · '))}</span>` : ''}</li>`).join('')}</ul>` : ''}
    ${g.premios.length ? `<h4>Premios y objetos</h4><ul class="wk-lista" style="columns:1">${g.premios.map(o => `<li>${esc(o.n)}${o.d ? ` <small>· ${esc(o.d)}</small>` : ''}</li>`).join('')}</ul>` : ''}
    <a class="gym-wiki" href="${esc(g.url)}" target="_blank" rel="noopener">Ver el gimnasio en la wiki ↗</a></article>`).join('');
}

// ----- Objetos: dónde conseguir cada cosa -----
const OBJ = { q: '', area: 'todas' };
const WK_OBJ_GUIAS = [['Región Star', 'Guía de Objetos en la Región Star'], ['Islas Cometa', 'Guía de Objetos en Islas Cometa'], ['La Jungla', 'Guía de Objetos en La Jungla']];
function wkGuiaObjetos(wt, area) {
  const out = []; let zona = '';
  wkTablas(wt).forEach(t => wkFilas(t).forEach(f => {
    const h = f.match(/^\s*!\s*colspan[^\n]*$/m);
    if (h) { const z = wkLimpiar(h[0].replace(/^\s*![^|\n]*\|/, '')).replace(/:\s*$/, '').trim(); if (z) zona = z; return; }
    const tx = wkCols(f).map(c => wkLimpiar(c)).filter(Boolean);
    if (tx.length >= 2 && tx[0].length <= 60) out.push({ area, zona, n: tx[0], d: tx.slice(1).join(' · ').slice(0, 280) });
  }));
  return out;
}
async function wkObjetos() {
  if (WK.obj) return WK.obj;
  const g = wkCache('obj1', 24); if (g) return (WK.obj = g);
  const partes = await Promise.all(WK_OBJ_GUIAS.map(async ([area, p]) => { try { const pg = await wkPagina(p); return pg ? wkGuiaObjetos(pg.wt, area) : []; } catch (e) { return []; } }));
  const out = partes.flat();
  if (!out.length) throw new Error('La wiki no devolvió las guías de objetos.');
  return (WK.obj = wkCache('obj1', 0, out));
}
async function pintarObj() {
  const el = $('#listaObj'); if (!el) return;
  try { await wkObjetos(); } catch (e) { el.innerHTML = wkFallo(e, 'obj'); return; }
  renderObj();
}
function renderObj() {
  const el = $('#listaObj'); if (!el || !WK.obj) return;
  const q = wkNorm(OBJ.q), vis = WK.obj.filter(x => (OBJ.area === 'todas' || x.area === OBJ.area) && (!q || wkNorm(x.n + ' ' + x.zona + ' ' + x.d).includes(q)));
  $('#filtrosObj').innerHTML = [['todas', 'Todo']].concat(WK_OBJ_GUIAS.map(([a]) => [a, a])).map(([id, l]) => { const n = id === 'todas' ? WK.obj.length : WK.obj.filter(x => x.area === id).length; return n || id === 'todas' ? `<button type="button" class="chip" data-act="obj-area" data-f="${esc(id)}" aria-pressed="${id === OBJ.area}">${esc(l)}<b>${n}</b></button>` : ''; }).join('');
  const grupos = []; vis.forEach(x => { const k = x.area + '|' + x.zona; let g = grupos[grupos.length - 1]; if (!g || g.k !== k) grupos.push(g = { k, area: x.area, zona: x.zona, l: [] }); g.l.push(x); });
  el.innerHTML = grupos.length ? grupos.map(g => `<details class="obj-z"${q ? ' open' : ''}><summary><b>${esc(g.zona || g.area)}</b><small>${g.l.length} ${g.l.length === 1 ? 'objeto' : 'objetos'}${OBJ.area === 'todas' && g.zona ? ' · ' + esc(g.area) : ''}</small></summary><ul>${g.l.map(x => `<li><b>${esc(x.n)}</b><span>${esc(x.d)}</span></li>`).join('')}</ul>${g.zona && zonaConocida(g.zona) ? `<p class="obj-ir">Ver la zona: ${zonaA(g.zona)}</p>` : ''}</details>`).join('')
    : '<p class="vacio">Ningún objeto coincide con la búsqueda.</p>';
}

// ----- Guías de la comunidad (índice que lleva a la wiki) -----
const WK_GUIAS_GRUPOS = [
  { id: 'liga', l: 'Después de cada liga', p: 'Qué hacer y adónde ir después de ganar cada liga.', re: /despu[eé]s de la liga/i },
  { id: 'mec', l: 'Mecánicas del juego', p: 'Cómo funcionan las mecánicas propias de Reloaded.' },
  { id: 'poke', l: 'Pokémon: dónde y cómo', p: 'Legendarios, iniciales, ultraentes y los Pokémon más buscados.', re: /localizaci|pok[eé]mon|starter|ultraente|magikarp|inicial|minador|ratio|legendari|intercambio/i },
  { id: 'obj', l: 'Objetos', p: 'Objetos, discos técnicos, pergaminos y accesorios.', re: /objeto|disco|pergamino|anillo|pendiente|baya|cristal|piedra/i },
  { id: 'mis', l: 'Misiones e historia', p: 'Misiones de la historia: las islas, los casos y los anillos.' },
  { id: 'lug', l: 'Lugares, islas y eventos', p: 'Islas, el Frente de Batalla, eventos y lugares especiales.', re: /isla|frente|loter|cafeter|guarida|cueva|coleccionista|esp[ií]ritu|sabio|ladr[oó]n|jungla|torre/i },
  { id: 'otras', l: 'Más guías', p: 'Otras guías hechas por la comunidad de la wiki.' }
];
const WK_GUIAS_AQUI = [[/legendarios y singulares|ultraentes/i, 'legendarios'], [/^gu[ií]a de objetos en/i, 'objetos'], [/ubicaci[oó]n de las mt|^mt$|^mo$|disco t[eé]cnico/i, 'movimientos'], [/habilidades externas/i, 'habilidades'], [/frente de batalla|^as del frente/i, 'personajes'], [/tabla de tipos/i, 'tipos']];
async function wkGuias() {
  if (WK.guias) return WK.guias;
  const g = wkCache('guias2', 24); if (g) return (WK.guias = g);
  const cats = ['Guías', 'Guía Pokémon Reloaded', 'Guía Pokémon Reloaded TLB', 'Guías y manuales', 'Mecánica', 'Misiones'];
  const listas = await Promise.all(cats.map(c => wkCategoria(c).catch(() => [])));
  const mec = new Set(listas[4]), mis = new Set(listas[5]), todas = [...new Set(listas.flat())];
  const out = todas.map(t => ({ t, g: (WK_GUIAS_GRUPOS[0].re.test(t) ? 'liga' : mis.has(t) ? 'mis' : mec.has(t) ? 'mec' : (WK_GUIAS_GRUPOS.find(x => x.re && x.id !== 'liga' && x.re.test(t)) || { id: 'otras' }).id) }));
  if (!out.length) throw new Error('La wiki no devolvió las guías.');
  out.sort((a, b) => a.t.localeCompare(b.t, 'es'));
  return (WK.guias = wkCache('guias2', 0, out));
}
async function pintarGuias() {
  const el = $('#listaGuias'); if (!el) return;
  try { await wkGuias(); } catch (e) { el.innerHTML = wkFallo(e, 'guias'); return; }
  const aqui = t => { const m = WK_GUIAS_AQUI.find(([re]) => re.test(t)); return m ? `<a class="aqui" href="${MULTIPAGINA ? PAGINA_DE[m[1]] : '#' + m[1]}"${MULTIPAGINA ? '' : ` data-ir="${m[1]}"`}>En esta web</a>` : ''; };
  el.innerHTML = WK_GUIAS_GRUPOS.map(gr => { const l = WK.guias.filter(x => x.g === gr.id); return l.length ? `<section class="guia-gr"><h3>${esc(gr.l)} <small>${l.length}</small></h3><p>${esc(gr.p)}</p><ul>${l.map(x => `<li><a href="${esc(wkUrl(x.t))}" target="_blank" rel="noopener">${esc(x.t.replace(/^Pokémon Reloaded: /, ''))} ↗</a>${aqui(x.t)}</li>`).join('')}</ul></section>` : ''; }).join('');
}

// ----- Varias páginas de la wiki en un solo pedido (hasta 50 por vez) -----
async function wkVarias(titulos) {
  const out = {};
  for (let i = 0; i < titulos.length; i += 50) {
    const j = await wkApi('action=query&formatversion=2&prop=revisions&rvprop=content&rvslots=main&titles=' + encodeURIComponent(titulos.slice(i, i + 50).join('|')));
    Object.values((j.query && j.query.pages) || {}).forEach(p => { const r = p.revisions && p.revisions[0]; if (r) out[p.title] = (r.slots && r.slots.main && (r.slots.main.content || r.slots.main['*'])) || r.content || ''; });
  }
  return out;
}
/** Valor de una plantilla corta de la wiki, como {{t|fuego}} → "fuego". */
/** Tabla sin la línea de cierre "|}" (si no, queda pegada a la última celda). */
const wkSinCierre = tb => String(tb || '').replace(/\n\|\}\s*$/, '');
const wkValorT = s => { const m = String(s || '').match(/\{\{\s*t\s*\|\s*([^}|]+)/i); return m ? m[1].trim() : wkLimpiar(s); };
const wkLinkA = (n, base, slug) => `<a class="zn-a" href="${MULTIPAGINA ? base : ''}#${slug}">${esc(n)}</a>`;

// ----- Movimientos, MT, DT y MO -----
const MOV = { tab: 'todos', q: '', tipo: '' };
const MOV_CAT = { fisico: 'Físico', especial: 'Especial', otro: 'Estado', estado: 'Estado' };
const MOV_TABS = [{ id: 'todos', l: 'Todos' }, { id: 'mt', l: 'MT' }, { id: 'dt', l: 'DT' }, { id: 'mo', l: 'MO' }];
const movCat = s => MOV_CAT[wkNorm(wkValorT(s))] || '';
const catChip = c => c ? `<span class="cat cat-${wkSlug(c)}">${esc(c)}</span>` : '';
async function wkListaMov() {
  if (WK.mov) return WK.mov;
  const g = wkCache('mov1', 24); if (g) return (WK.mov = g);
  const pg = await wkVarias(['Lista movimientos', 'MT', 'Disco técnico', 'MO']);
  // La lista completa viene en pestañas, una por tipo: "Acero= {| … |} |-| Agua= …"
  const todos = [], vistos = new Set();
  (pg['Lista movimientos'] || '').split(/<tabber>|<\/tabber>|\n\|-\|/).forEach(ch => {
    const m = ch.match(/^\s*([^=\n{|]+?)\s*=/), t = m && wkTipo(m[1]), tb = wkSinCierre(wkTablas(ch)[0]);
    if (!t || !tb) return;
    wkFilas(tb).forEach(f => {
      const c = wkCols(f); if (c.length < 2) return;
      const n = wkLimpiar(c[0]); if (!n || /^nombre$/i.test(n) || vistos.has(wkNorm(n))) return;
      vistos.add(wkNorm(n));
      let pot = wkLimpiar(c[2] || ''), met = wkLimpiar(c[3] || '');
      if (!/\d|variable/i.test(pot) && /^\d+$/.test(met)) { pot = met; met = ''; } // algunas filas tienen la potencia en la última columna
      pot = /^\d+/.test(pot) ? pot.match(/^\d+/)[0] : /variable/i.test(pot) ? 'Variable' : '';
      todos.push({ n, t, c: movCat(c[1]), p: pot, m: met });
    });
  });
  const idx = new Map(todos.map(x => [wkNorm(x.n), x]));
  const tabla = wt => {
    const tb = wkTablas(wt || '').find(x => wkFilas(x).some(f => /^(MT|DT|MO)\d+$/i.test(wkLimpiar(wkCols(f)[0] || '').replace(/\s+/g, '')))) || '';
    return wkFilas(wkSinCierre(tb)).map(f => {
      const c = wkCols(f); if (c.length < 3) return null;
      const num = wkLimpiar(c[0]).replace(/\s+/g, ''), n = wkLimpiar(c[1]); if (!/^(MT|DT|MO)\d+$/i.test(num) || !n) return null;
      const x = idx.get(wkNorm(n)) || {};
      return { num: num.toUpperCase(), n, t: wkTipo(wkValorT(c[2])) || x.t || '', c: x.c || '', p: x.p || '', d: wkLimpiar(c[3] || '') };
    }).filter(Boolean).sort((a, b) => parseInt(a.num.slice(2), 10) - parseInt(b.num.slice(2), 10));
  };
  const out = { todos: todos.sort((a, b) => a.n.localeCompare(b.n, 'es')), mt: tabla(pg.MT), dt: tabla(pg['Disco técnico']), mo: tabla(pg.MO) };
  if (!out.todos.length && !out.mt.length) throw new Error('La wiki no devolvió los movimientos.');
  return (WK.mov = wkCache('mov1', 0, out));
}
async function pintarMov() {
  const el = $('#listaMov'); if (!el) return;
  try { await wkListaMov(); } catch (e) { el.innerHTML = wkFallo(e, 'mov'); return; }
  renderMov();
}
function renderMov() {
  const el = $('#listaMov'); if (!el || !WK.mov) return;
  $('#tabsMov').innerHTML = MOV_TABS.map(t => `<button type="button" class="chip" data-act="mov-tab" data-f="${t.id}" aria-pressed="${MOV.tab === t.id}">${t.l}<b>${WK.mov[t.id].length}</b></button>`).join('');
  const q = wkNorm(MOV.q), l = WK.mov[MOV.tab].filter(x => (!MOV.tipo || x.t === MOV.tipo) && (!q || wkNorm([x.n, x.num, x.m, x.d, x.t, x.c].join(' ')).includes(q)));
  $('#cuentaMov').textContent = l.length + (l.length === 1 ? ' movimiento' : ' movimientos') + (MOV.tab === 'todos' ? '' : ' · ' + { mt: 'máquinas técnicas', dt: 'discos técnicos', mo: 'máquinas ocultas' }[MOV.tab]);
  if (!l.length) { el.innerHTML = '<p class="vacio">Ningún movimiento coincide con la búsqueda.</p>'; return; }
  if (MOV.tab === 'todos') {
    el.innerHTML = `<div class="tabla-scroll"><table class="wk-tabla mov-tabla"><thead><tr><th>Movimiento</th><th>Tipo</th><th>Categoría</th><th>Potencia</th><th>Cómo se aprende</th></tr></thead><tbody>${l.map(x => `<tr><td><b>${esc(x.n)}</b></td><td>${tipoChip(x.t)}</td><td>${catChip(x.c)}</td><td>${esc(x.p || '—')}</td><td>${x.m ? esc(x.m) : '<small>—</small>'}</td></tr>`).join('')}</tbody></table></div>`;
    return;
  }
  el.innerHTML = `<ul class="mt-lista">${l.map(x => `<li style="--c:${COLOR_TIPO[x.t] || '#3d9ab8'}"><div class="mt-cab"><span class="mt-n">${esc(x.num)}</span><b>${esc(x.n)}</b>${tipoChip(x.t)}${catChip(x.c)}${x.p ? `<small>Potencia ${esc(x.p)}</small>` : ''}</div>${x.d ? `<p>${wkEnlazar(x.d)}</p>` : '<p class="muted">La wiki todavía no dice dónde se consigue.</p>'}</li>`).join('')}</ul>`;
}

// ----- Habilidades -----
const HAB = { q: '', solo: '' };
const PKW_URL = 'https://stormacher95.github.io/datos/pokedex-wiki.json';
// Nombres abreviados que aparecen en algunas fichas
const HAB_ABREV = { 'elec. estat': 'Electricidad estática', 'electr. estat': 'Electricidad estática', 'elect. estat': 'Electricidad estática', 'efect. espora': 'Efecto espora', 'efec. espora': 'Efecto espora', 'armad. bat': 'Armadura batalla', 'espir. vital': 'Espíritu vital' };
const habAbrev = s => HAB_ABREV[wkNorm(s).replace(/\s+/g, ' ').replace(/\.+$/, '')];
const habClave = s => { const a = habAbrev(s); return wkNorm(a || s).replace(/\s*\(habilidad\)\s*$/, '').replace(/\s+/g, ' ').replace(/\.+$/, ''); };
const habSlug = n => 'h-' + wkSlug(habClave(n));
const habA = n => wkLinkA(n, '/wiki/habilidades.html', habSlug(n));
/** Lo que hace la habilidad (primer párrafo útil del efecto), lo que cambia en Reloaded y lo que hace fuera de combate. */
function habEfecto(wt) {
  const parr = t => (t || '').replace(/^=+[^\n]*=+\s*$/gm, '\n').split(/\n\s*\n/).map(p => p.trim()).filter(p => p && !/^(\{\||\{\{)/.test(p))
    .map(p => wkLimpiar(p.replace(/^[:*#]+\s*/gm, '')).replace(/(?<=[.!)])\s+[^.!]*:\s*$/, '')).filter(p => p.length > 12);
  const corto = p => p && p.length > 360 ? p.slice(0, 340).replace(/\s+\S*$/, '') + '…' : (p || '');
  const ef = wkSeccion(wt, /^efectos?$/i), fuera = wkSeccion(wt, /fuera de combate/i);
  const e = parr(ef ? (fuera ? ef.replace(fuera, '') : ef) : wt.replace(/\{\{[\s\S]*?\}\}\s*/, '')).find(x => !/introducid[ao] en|es una habilidad|en ingl[eé]s|^en (pok[eé]mon )?reloaded/i.test(x)) || '';
  const r = parr(wt).find(x => /reloaded/i.test(x) && x !== e && !/introducid|es una habilidad/i.test(x)) || '';
  return { e: corto(e), r: corto(r), f: corto(parr(fuera)[0]) };
}
function habExternas(wt) {
  const lista = s => (s || '').split('\n').filter(l => /^\*\s*'''/.test(l)).map(l => { const m = l.match(/^\*\s*'''([^']+)'''\s*:?\s*(.*)$/); return m ? { n: wkLimpiar(m[1]).replace(/:$/, ''), d: wkLimpiar(m[2]) } : null; }).filter(Boolean);
  const med = [];
  const tb = wkSinCierre(wkTablas(wkSeccion(wt, /medallas/i))[0]);
  if (tb) wkFilas(tb).forEach(f => { const c = wkCols(f); if (c.length < 2) return; const m = wkLimpiar(c[0]); const movs = c[1].split('\n').filter(l => /^\s*\*/.test(l)).map(l => wkLimpiar(l.replace(/^\s*\*+/, ''))).filter(Boolean); if (m && movs.length) med.push({ m, movs }); });
  return { act: lista(wkSeccion(wt, /^activas$/i)), pas: lista(wkSeccion(wt, /^pasivas$/i)), med };
}
async function wkHabilidades() {
  if (WK.hab) return WK.hab;
  const g = wkCache('hab2', 24 * 3); if (g) return (WK.hab = g);
  const [titulos, distintas, pkw] = await Promise.all([wkCategoria('Habilidades'), wkCategoria('Habilidades Diferentes').catch(() => []), fetch(PKW_URL).then(r => r.ok ? r.json() : null).catch(() => null)]);
  const pags = await wkVarias(titulos.filter(t => !/^(habilidad(es)?\b|la revoluci)/i.test(t)).concat(['Habilidades Externas']));
  const dif = new Set(distintas.map(habClave)), m = new Map();
  const de = (n, url) => { const k = habClave(n); if (!k || k === '???') return null; let x = m.get(k); if (!x) m.set(k, x = { n: n.replace(/\s*\(habilidad\)\s*$/i, ''), e: '', r: '', f: '', url: url || '', dif: dif.has(k), pk: [], oc: [] }); return x; };
  Object.entries(pags).forEach(([t, wt]) => { if (/^habilidades externas$/i.test(t)) return; const x = de(t, wkUrl(t)); if (!x || x.e) return; x.n = t.replace(/\s*\(habilidad\)\s*$/i, ''); x.url = wkUrl(t); Object.assign(x, habEfecto(wt)); });
  // Qué Pokémon tiene cada una: de la Pokédex compilada de la wiki. Las fichas con formas raras ("Llovizna FN Mar del albor FP") se reparten entre las habilidades conocidas.
  if (pkw && pkw.pokemon) {
    const limpia = s => /^[A-ZÁÉÍÓÚÑ¿][a-záéíóúñü]+( [a-záéíóúñüA-ZÁÉÍÓÚ]+){0,3}$/.test(s) && !/[a-z][A-Z]/.test(s);
    const todas = pkw.pokemon.flatMap(p => [...(p.hab || []), p.oc].filter(Boolean));
    todas.filter(limpia).forEach(h => de(h));
    todas.filter(habAbrev).forEach(h => de(habAbrev(h)));
    const conocidas = [...m.keys()].sort((a, b) => b.length - a.length);
    const repartir = s => {
      if (limpia(s) || m.has(habClave(s))) return [habClave(s)];
      // "PresiónFM", "Llovizna FN Mar del albor FP", "sombra trampa-allanamiento": se buscan las habilidades conocidas como palabras sueltas
      let r = ' ' + wkNorm(s.replace(/([a-záéíóúñü])([A-Z])/g, '$1 $2')).replace(/[^a-z0-9ñ ]+/g, ' ') + ' ';
      const out = [];
      conocidas.forEach(k => { const i = r.indexOf(' ' + k + ' '); if (i >= 0) { out.push(k); r = r.slice(0, i) + ' '.repeat(k.length + 1) + r.slice(i + k.length + 1); } });
      return out;
    };
    pkw.pokemon.forEach(p => {
      (p.hab || []).forEach(h => repartir(h).forEach(k => { const x = m.get(k); if (x && !x.pk.includes(p.n)) x.pk.push(p.n); }));
      if (p.oc) repartir(p.oc).forEach(k => { const x = m.get(k); if (x && !x.oc.includes(p.n) && !x.pk.includes(p.n)) x.oc.push(p.n); });
    });
  }
  const lista = [...m.values()].filter(x => x.e || x.pk.length || x.oc.length).sort((a, b) => a.n.localeCompare(b.n, 'es'));
  lista.forEach(x => { if (x.n === x.n.toLowerCase()) x.n = x.n.charAt(0).toUpperCase() + x.n.slice(1); });
  if (!lista.length) throw new Error('La wiki no devolvió las habilidades.');
  return (WK.hab = wkCache('hab2', 0, { lista, ext: habExternas(pags['Habilidades Externas'] || '') }));
}
async function pintarHab() {
  const el = $('#listaHab'); if (!el) return;
  try { await wkHabilidades(); } catch (e) { el.innerHTML = wkFallo(e, 'hab'); return; }
  const x = WK.hab.ext, ex = $('#extHab');
  if (ex && (x.act.length || x.pas.length)) {
    const li = l => l.map(h => `<li><b>${esc(h.n)}</b><span>${wkEnlazar(h.d)}</span></li>`).join('');
    ex.innerHTML = `<h3>Habilidades externas <small>propias de Reloaded</small></h3><p>Son acciones que tu equipo puede hacer fuera de combate. Las activas se eligen desde el menú y siguen disponibles aunque el Pokémon olvide el movimiento; las pasivas funcionan solas.</p>
      <div class="ext-g">${x.act.length ? `<div><h4>Activas</h4><ul>${li(x.act)}</ul></div>` : ''}${x.pas.length ? `<div><h4>Pasivas</h4><ul>${li(x.pas)}</ul></div>` : ''}</div>
      ${x.med.length ? `<h4>Qué medalla las desbloquea</h4><div class="ext-med">${x.med.map(r => `<div><b>${esc(r.m)}</b><span>${esc(r.movs.join(' · '))}</span></div>`).join('')}</div>` : ''}`;
    ex.hidden = false;
  }
  renderHab(); anclaHash();
}
function renderHab() {
  const el = $('#listaHab'); if (!el || !WK.hab) return;
  const L = WK.hab.lista, q = wkNorm(HAB.q);
  $('#filtrosHab').innerHTML = [['', 'Todas', L.length], ['dif', 'Cambian en Reloaded', L.filter(h => h.dif).length]].map(([k, l, n]) => `<button type="button" class="chip" data-act="hab-filtro" data-f="${k}" aria-pressed="${HAB.solo === k}">${l}<b>${n}</b></button>`).join('');
  const vis = L.filter(h => (!HAB.solo || h.dif) && (!q || wkNorm([h.n, h.e, h.r, h.f, h.pk.join(' '), h.oc.join(' ')].join(' ')).includes(q)));
  const pks = (l, ocl) => { const todos = l.map(n => pkA(n)).concat(ocl.map(n => pkA(n, n + ' (oculta)'))); return todos.length > 14 ? todos.slice(0, 12).join('') + `<details class="mas"><summary>y ${todos.length - 12} más</summary>${todos.slice(12).join('')}</details>` : todos.join(''); };
  el.innerHTML = vis.length ? vis.map(h => `<article class="hab" id="${habSlug(h.n)}">
      <header><h3>${esc(h.n)}</h3>${h.dif ? '<span class="pk-exc">Cambia en Reloaded</span>' : ''}</header>
      ${h.e ? `<p>${esc(h.e)}</p>` : ''}
      ${h.r ? `<p class="hab-nota"><b>Reloaded</b>${esc(h.r)}</p>` : ''}${h.f ? `<p class="hab-nota fuera"><b>Fuera de combate</b>${esc(h.f)}</p>` : ''}
      ${h.pk.length || h.oc.length ? `<div class="hab-pk">${pks(h.pk, h.oc)}</div>` : ''}
      ${h.url ? `<a class="gym-wiki" href="${esc(h.url)}" target="_blank" rel="noopener">Ver en la wiki ↗</a>` : ''}
    </article>`).join('') : '<p class="vacio">Ninguna habilidad coincide con la búsqueda.</p>';
}

// ----- Personajes: ligas, Frente de Batalla y villanos -----
const PJ = { g: 'todos', reg: '', q: '' };
const PJ_GRUPOS = [{ id: 'todos', l: 'Todos' }, { id: 'liga', l: 'Ligas y rivales' }, { id: 'frente', l: 'Frente de Batalla' }, { id: 'villanos', l: 'Villanos' }, { id: 'otros', l: 'Otros personajes' }];
const PJ_REGIONES = ['Star', 'Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Teselia', 'Kalos', 'Alola'];
const pjRegion = s => { const n = wkNorm(s); if (/jungla|star/.test(n)) return 'Star'; return PJ_REGIONES.find(r => n.includes(wkNorm(r))) || ''; };
const pjOrden = r => /l[ií]der de gimnasio/i.test(r) ? 0 : /alto mando/i.test(r) ? 1 : /campe/i.test(r) ? 2 : /sub-as/i.test(r) ? 3 : /^as /i.test(r) ? 4 : 5;
function pjEquipos(wt) {
  const out = [], re = /\{\{\s*Equipo Pok[eé]mon/gi; let m;
  while ((m = re.exec(wt))) {
    const pl = wkPlantilla(wt.slice(m.index)); if (!pl) continue;
    const p = pl.params, poks = [];
    for (let k = 1; k <= 6; k++) {
      const n = wkLimpiar(p['poké' + k] || p['poke' + k] || ''); if (!n) continue;
      poks.push({ n, niv: wkLimpiar(p['nvpoké' + k] || p['nvpoke' + k] || ''), obj: wkLimpiar(p['objpoké' + k] || p['objpoke' + k] || ''), hab: wkLimpiar(p['habpoké' + k] || p['habpoke' + k] || ''), movs: [1, 2, 3, 4].map(j => wkLimpiar(p['m' + j + 'p' + k] || '')).filter(Boolean) });
    }
    if (!poks.length) continue;
    const hs = [...wt.slice(0, m.index).matchAll(/^(={2,4})\s*(.*?)\s*\1\s*$/gm)], h = hs.length ? wkLimpiar(hs[hs.length - 1][2]) : '';
    out.push({ t: /^equipos?( pok[eé]mon)?$/i.test(h) ? '' : h, poks });
  }
  if (!out.length) { // Fichas viejas: el equipo está en una tabla común
    const s = wkSeccion(wt, /equipo/i), tb = s && wkTablas(s)[0];
    const l = tb ? wkEquipo(tb) : []; if (l.length) out.push({ t: '', poks: l.map(x => ({ n: x.n, niv: x.niv, obj: '', hab: '', movs: x.movs })) });
  }
  return out;
}
function pjResumen(wt) {
  const ps = wt.replace(/\{\{[\s\S]*?\}\}/g, '').split(/\n\s*\n|^=.*=$/m).map(p => wkLimpiar(p)).filter(p => p.length > 30 && !/^[^\wÀ-ÿ¡¿"']/.test(p));
  const p = ps[0] || ''; const f = p.match(/^.{30,240}?[.!](?=\s|$)/);
  return f ? f[0] : p.slice(0, 220);
}
async function wkPersonajes() {
  if (WK.pj) return WK.pj;
  const g = wkCache('pj2', 24); if (g) return (WK.pj = g);
  const [titulos, ases, sub1, sub2, villanos] = await Promise.all(['Personajes', 'As del Frente', 'Sub-As del Frente', 'Sub Ases del Frente', 'Equipos Enemigos'].map(c => wkCategoria(c).catch(() => [])));
  const subs = new Set([...sub1, ...sub2]), asesS = new Set(ases);
  // Algunas fichas no dicen la clase ni la región: salen de las categorías de la wiki
  const PJ_CATS = ['Star', 'Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Teselia'].map(r => ['Líderes de gimnasio de ' + r, 'Líder de Gimnasio', r]).concat(['Star', 'Kanto', 'Johto', 'Hoenn'].map(r => ['Alto Mando de ' + r, 'Alto Mando', r]), [['Campeón de la Liga Pokémon', 'Campeón', '']]);
  const porCat = {};
  (await Promise.all(PJ_CATS.map(([c]) => wkCategoria(c).catch(() => [])))).forEach((l, i) => l.forEach(t => { if (!porCat[t]) porCat[t] = { rol: PJ_CATS[i][1], region: PJ_CATS[i][2] }; }));
  const pags = await wkVarias(titulos);
  const lista = [], otros = [];
  Object.entries(pags).forEach(([t, wt]) => {
    const i = wt.search(/\{\{\s*Personaje\s*[\n|]/i), p = i >= 0 ? (wkPlantilla(wt.slice(i)) || {}).params || {} : {};
    const equipos = pjEquipos(wt);
    if (/^(gimnasio|alto mando$|campe[oó]n$|l[ií]der de gimnasio$|liga )/i.test(t)) return; // páginas generales, no personajes
    if (i < 0 && !equipos.length) { if (!/^(personaje|entrenador)/i.test(t)) otros.push(t); return; }
    const cat = porCat[t] || {}, clase = wkLimpiar(p.clase || '').replace(/(Líder de Gimnasio)\s*Villano/i, '$1 · Villano').replace(/^Ninguno \(Antes de ser líder\)/i, '');
    const rol = asesS.has(t) ? 'As del Frente' : subs.has(t) ? 'Sub-As del Frente' : clase || cat.rol || '';
    const cats = [...wt.matchAll(/\[\[\s*Categor[ií]a\s*:\s*([^\]|]+)/gi)].map(x => x[1].trim()).join(' ');
    const gr = asesS.has(t) || subs.has(t) ? 'frente' : /l[ií]der de gimnasio|alto mando|campe[oó]n|rival/i.test(rol) ? 'liga'
      : /villan|lugarteniente|organizaci|l[ií]der de equipo|almirante|comandante/i.test(rol) || /team |equipo (rocket|aqua|magma|galaxia|plasma|flare|skull)|rekiem|equipos enemigos/i.test(cats) ? 'villanos' : 'otros';
    lista.push({ n: t.replace(/\s*\(personaje\)$/i, ''), rol, g: gr, region: pjRegion(p['región'] || p.region || '') || cat.region || '', tipos: [wkTipo(p.tipo1), wkTipo(p.tipo2)].filter(Boolean), eq: equipos, res: pjResumen(wt), url: wkUrl(t) });
  });
  lista.sort((a, b) => ((PJ_REGIONES.indexOf(a.region) + 1 || 99) - (PJ_REGIONES.indexOf(b.region) + 1 || 99)) || (pjOrden(a.rol) - pjOrden(b.rol)) || a.n.localeCompare(b.n, 'es'));
  if (!lista.length) throw new Error('La wiki no devolvió los personajes.');
  return (WK.pj = wkCache('pj2', 0, { lista, otros: otros.sort((a, b) => a.localeCompare(b, 'es')), villanos: villanos.filter(v => !/^categor/i.test(v)) }));
}
async function pintarPj() {
  const el = $('#listaPj'); if (!el) return;
  try { await wkPersonajes(); } catch (e) { el.innerHTML = wkFallo(e, 'pj'); return; }
  renderPj();
}
function renderPj() {
  const el = $('#listaPj'); if (!el || !WK.pj) return;
  const L = WK.pj.lista, q = wkNorm(PJ.q);
  $('#filtrosPj').innerHTML = PJ_GRUPOS.map(g => { const n = g.id === 'todos' ? L.length : L.filter(x => x.g === g.id).length; return n ? `<button type="button" class="chip" data-act="pj-filtro" data-f="${g.id}" aria-pressed="${PJ.g === g.id}">${g.l}<b>${n}</b></button>` : ''; }).join('');
  const regs = PJ_REGIONES.filter(r => L.some(x => x.region === r && (PJ.g === 'todos' || x.g === PJ.g)));
  $('#regionesPj').innerHTML = regs.length > 1 ? ['', ...regs].map(r => `<button type="button" class="chip chip-sm" data-act="pj-region" data-f="${r}" aria-pressed="${PJ.reg === r}">${r || 'Todas las regiones'}</button>`).join('') : '';
  const vis = L.filter(x => (PJ.g === 'todos' || x.g === PJ.g) && (!PJ.reg || x.region === PJ.reg)
    && (!q || wkNorm([x.n, x.rol, x.region, x.tipos.join(' '), x.eq.map(e => e.poks.map(p => p.n).join(' ')).join(' ')].join(' ')).includes(q)));
  const eqHTML = (e, i, total) => `<details class="pj-eq"><summary><b>${esc(e.t || (i ? 'Equipo ' + (i + 1) : 'Equipo'))}</b><span>${esc(e.poks.map(p => p.n).join(' · '))}</span></summary>
      <ul class="gym-eq">${e.poks.map(p => `<li>${pkA(p.n)}${p.niv ? ` <small>Nv. ${esc(p.niv)}</small>` : ''}${p.obj || p.hab ? `<small class="pj-oh">${[p.obj && esc(p.obj), p.hab && habA(p.hab)].filter(Boolean).join(' · ')}</small>` : ''}${p.movs.length ? `<span>${esc(p.movs.join(' · '))}</span>` : ''}</li>`).join('')}</ul></details>`;
  const villanos = PJ.g === 'villanos' && WK.pj.villanos.length ? `<div class="pj-org"><b>Organizaciones</b>${WK.pj.villanos.map(v => `<a href="${esc(wkUrl(v))}" target="_blank" rel="noopener">${esc(v)} ↗</a>`).join('')}</div>` : '';
  el.innerHTML = villanos + (vis.length ? `<div class="pj-g">${vis.map(x => `<article class="pj" style="--c:${COLOR_TIPO[x.tipos[0]] || '#3d9ab8'}">
      <header><h3>${esc(x.n)}</h3><p>${esc([x.rol, x.region && (x.region === 'Star' ? 'Región Star' : x.region)].filter(Boolean).join(' · ') || 'Personaje')}</p>${x.tipos.length ? `<p class="pk-tipos">${x.tipos.map(tipoChip).join('')}</p>` : ''}</header>
      ${x.res ? `<p class="pj-res">${esc(x.res)}</p>` : ''}
      ${x.eq.map((e, i) => eqHTML(e, i, x.eq.length)).join('')}
      <a class="gym-wiki" href="${esc(x.url)}" target="_blank" rel="noopener">Ver en la wiki ↗</a>
    </article>`).join('')}</div>` : '<p class="vacio">Ningún personaje coincide con la búsqueda.</p>')
    + (PJ.g === 'otros' && !q && WK.pj.otros.length ? `<div class="pj-org"><b>Más personajes en la wiki</b>${WK.pj.otros.map(v => `<a href="${esc(wkUrl(v))}" target="_blank" rel="noopener">${esc(v)} ↗</a>`).join('')}</div>` : '');
}

// ----- Tabla de tipos (no depende de la wiki) -----
const TIPOS = Object.keys(COLOR_TIPO);
const EFECT = (() => {
  const t = {
    Normal: { Roca: .5, Fantasma: 0, Acero: .5 },
    Fuego: { Fuego: .5, Agua: .5, Planta: 2, Hielo: 2, Bicho: 2, Roca: .5, 'Dragón': .5, Acero: 2 },
    Agua: { Fuego: 2, Agua: .5, Planta: .5, Tierra: 2, Roca: 2, 'Dragón': .5 },
    Planta: { Fuego: .5, Agua: 2, Planta: .5, Veneno: .5, Tierra: 2, Volador: .5, Bicho: .5, Roca: 2, 'Dragón': .5, Acero: .5 },
    'Eléctrico': { Agua: 2, Planta: .5, 'Eléctrico': .5, Tierra: 0, Volador: 2, 'Dragón': .5 },
    Hielo: { Fuego: .5, Agua: .5, Planta: 2, Hielo: .5, Tierra: 2, Volador: 2, 'Dragón': 2, Acero: .5 },
    Lucha: { Normal: 2, Hielo: 2, Veneno: .5, Volador: .5, 'Psíquico': .5, Bicho: .5, Roca: 2, Fantasma: 0, Siniestro: 2, Acero: 2, Hada: .5 },
    Veneno: { Planta: 2, Veneno: .5, Tierra: .5, Roca: .5, Fantasma: .5, Acero: 0, Hada: 2 },
    Tierra: { Fuego: 2, Planta: .5, 'Eléctrico': 2, Veneno: 2, Volador: 0, Bicho: .5, Roca: 2, Acero: 2 },
    Volador: { Planta: 2, 'Eléctrico': .5, Lucha: 2, Bicho: 2, Roca: .5, Acero: .5 },
    'Psíquico': { Lucha: 2, Veneno: 2, 'Psíquico': .5, Siniestro: 0, Acero: .5 },
    Bicho: { Fuego: .5, Planta: 2, Lucha: .5, Veneno: .5, Volador: .5, 'Psíquico': 2, Fantasma: .5, Siniestro: 2, Acero: .5, Hada: .5 },
    Roca: { Fuego: 2, Hielo: 2, Lucha: .5, Tierra: .5, Volador: 2, Bicho: 2, Acero: .5 },
    Fantasma: { Normal: 0, 'Psíquico': 2, Fantasma: 2, Siniestro: .5 },
    'Dragón': { 'Dragón': 2, Acero: .5, Hada: 0 },
    Siniestro: { Lucha: .5, 'Psíquico': 2, Fantasma: 2, Siniestro: .5, Hada: .5 },
    Acero: { Fuego: .5, Agua: .5, 'Eléctrico': .5, Hielo: 2, Roca: 2, Acero: .5, Hada: 2 },
    Hada: { Fuego: .5, Lucha: 2, Veneno: .5, 'Dragón': 2, Siniestro: 2, Acero: .5 }
  };
  return (a, d) => (t[a] && d in t[a]) ? t[a][d] : 1;
})();
/** Multiplicador de cada tipo de ataque contra un Pokémon de uno o dos tipos. */
const defensa = tipos => TIPOS.map(a => [a, tipos.filter(Boolean).reduce((m, d) => m * EFECT(a, d), 1)]);
const MULT_TXT = { 4: '×4', 2: '×2', 0.5: '×½', 0.25: '×¼', 0: '×0' };
function debilidadesHTML(tipos) {
  const d = defensa(tipos), g = (f, t) => { const l = d.filter(([, m]) => f(m)); return l.length ? `<div class="deb-f"><span class="deb-t">${t}</span><span>${l.map(([a, m]) => tipoChip(a) + (m === 4 || m === 0.25 ? `<b class="deb-x">${MULT_TXT[m]}</b>` : '')).join('')}</span></div>` : ''; };
  return `<div class="deb">${g(m => m >= 2, 'Débil a')}${g(m => m > 0 && m < 1, 'Resiste')}${g(m => m === 0, 'Inmune a')}</div>`;
}
const TIP = { d: ['Planta', ''], a: '' };
function pintarTipos() {
  const el = $('#calcTipos'); if (!el) return;
  const opc = sel => '<option value="">—</option>' + TIPOS.map(t => `<option${t === sel ? ' selected' : ''}>${t}</option>`).join('');
  el.innerHTML = `<div class="calc-g">
      <div class="calc"><h3>¿A qué es débil?</h3><p class="muted">Elegí uno o dos tipos, como los de un Pokémon.</p>
        <div class="calc-sel"><select class="sel" id="tipoD1" aria-label="Primer tipo">${opc(TIP.d[0]).replace('<option value="">—</option>', '')}</select><select class="sel" id="tipoD2" aria-label="Segundo tipo">${opc(TIP.d[1])}</select></div>
        <div id="resD" aria-live="polite"></div></div>
      <div class="calc"><h3>¿Contra qué pega fuerte?</h3><p class="muted">Elegí el tipo de un movimiento.</p>
        <div class="calc-sel"><select class="sel" id="tipoA" aria-label="Tipo del movimiento">${opc(TIP.a || 'Fuego').replace('<option value="">—</option>', '')}</select></div>
        <div id="resA" aria-live="polite"></div></div></div>`;
  const tabla = $('#tablaTipos');
  if (tabla) tabla.innerHTML = `<table class="tt"><caption>Ataque (filas) contra defensa (columnas)</caption><thead><tr><th scope="col"><span class="sr">Ataque</span></th>${TIPOS.map(t => `<th scope="col"><span class="tt-v" style="--tc:${COLOR_TIPO[t]}" title="${t}">${t.slice(0, 3)}</span></th>`).join('')}</tr></thead><tbody>${TIPOS.map(a => `<tr><th scope="row">${tipoChip(a)}</th>${TIPOS.map(d => { const m = EFECT(a, d); return `<td class="m${String(m).replace('.', '')}" title="${a} contra ${d}: ${MULT_TXT[m] || '×1'}">${m === 1 ? '' : MULT_TXT[m]}</td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
  calcTipos();
  ['#tipoD1', '#tipoD2', '#tipoA'].forEach(s => $(s).addEventListener('change', calcTipos));
}
function calcTipos() {
  const d1 = $('#tipoD1').value, d2 = $('#tipoD2').value, a = $('#tipoA').value;
  TIP.d = [d1, d2 === d1 ? '' : d2]; TIP.a = a;
  $('#resD').innerHTML = debilidadesHTML(TIP.d);
  const g = (f, t) => { const l = TIPOS.filter(d => f(EFECT(a, d))); return l.length ? `<div class="deb-f"><span class="deb-t">${t}</span><span>${l.map(tipoChip).join('')}</span></div>` : ''; };
  $('#resA').innerHTML = `<div class="deb">${g(m => m === 2, 'Súper eficaz contra')}${g(m => m === 0.5, 'Poco eficaz contra')}${g(m => m === 0, 'No afecta a')}</div>`;
}
/** En las páginas con id en el hash (#h-…), abre y resalta la tarjeta. */
function anclaHash() {
  const m = location.hash.match(/^#(h-[\w-]+)$/); if (!m) return;
  const d = document.getElementById(m[1]);
  if (!d) { if (!MULTIPAGINA && hay('#habilidades') && !WK.hab) ir('habilidades'); return; }
  $$('dialog[open]').forEach(cerrar);
  d.scrollIntoView({ block: 'center' }); d.classList.remove('marcada'); void d.offsetWidth; d.classList.add('marcada');
}
window.addEventListener('hashchange', anclaHash);

// ----- Carga perezosa: cada sección pide sus datos cuando se acerca a la pantalla -----
{ const pp = $('#pkPagina'); if (pp) pintarPokemonPagina(pp); }
const WK_CARGAS = { rutas: pintarRutas, dex: pintarDex, leg: pintarLeg, gym: pintarGym, obj: pintarObj, guias: pintarGuias, mov: pintarMov, hab: pintarHab, pj: pintarPj, tipos: pintarTipos };
(() => {
  const els = $$('[data-wk-carga]');
  const una = el => { if (el.dataset.cargado) return; el.dataset.cargado = '1'; WK_CARGAS[el.dataset.wkCarga](); };
  if ('IntersectionObserver' in window) { const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); una(e.target); } }), { rootMargin: '500px 0px' }); els.forEach(el => io.observe(el)); }
  else els.forEach(una);
  const ts = {}, deb = (k, f) => () => { clearTimeout(ts[k]); ts[k] = setTimeout(f, 180); };
  const en = (s, ev, f) => { const x = $(s); if (x) x.addEventListener(ev, f); };
  const sel = $('#tipoDex'); if (sel) sel.innerHTML = '<option value="">Todos los tipos</option>' + Object.keys(COLOR_TIPO).map(t => `<option>${t}</option>`).join('');
  const gen = $('#genDex'); if (gen) gen.innerHTML = '<option value="">Todas las generaciones</option>' + GENS.map((g, i) => `<option value="${i + 1}">${i + 1}.ª generación · ${g[2]}</option>`).join('');
  en('#buscarDex', 'input', deb('dex', () => { DEX.q = $('#buscarDex').value.trim(); renderDex(); }));
  en('#tipoDex', 'change', e => { DEX.tipo = e.target.value; renderDex(); });
  en('#genDex', 'change', e => { DEX.gen = e.target.value; renderDex(); });
  en('#buscarLeg', 'input', deb('leg', () => { LEG.q = $('#buscarLeg').value.trim(); renderLeg(); }));
  en('#buscarObj', 'input', deb('obj', () => { OBJ.q = $('#buscarObj').value.trim(); renderObj(); }));
  en('#buscarRuta', 'input', deb('rut', () => { RUT.q = $('#buscarRuta').value.trim(); renderRutas(); }));
  const tm = $('#tipoMov'); if (tm) tm.innerHTML = '<option value="">Todos los tipos</option>' + Object.keys(COLOR_TIPO).map(t => `<option>${t}</option>`).join('');
  en('#tipoMov', 'change', e => { MOV.tipo = e.target.value; renderMov(); });
  en('#buscarMov', 'input', deb('mov', () => { MOV.q = $('#buscarMov').value.trim(); renderMov(); }));
  en('#buscarHab', 'input', deb('hab', () => { HAB.q = $('#buscarHab').value.trim(); renderHab(); }));
  en('#buscarPj', 'input', deb('pj', () => { PJ.q = $('#buscarPj').value.trim(); renderPj(); }));
})();

// ---------- Reglas (las editan el admin y el noticiero) ----------
function renderReglas() {
  const ol = $('#listaReglas'); if (!ol || !Array.isArray(S.d.reglas)) return; // con el código viejo quedan las reglas fijas
  const ed = puedeGuerra(), rs = S.d.reglas;
  ol.innerHTML = rs.length ? rs.map((r, i) => `<li${r.destacada === '1' ? ' class="elite"' : ''}><div><h3>${esc(r.titulo)}</h3><p>${esc(r.texto)}</p>${r.nota ? `<small>${esc(r.nota)}</small>` : ''}${ed ? `<div class="regla-acc"><button class="btn sm" type="button" data-act="regla-editar" data-id="${esc(r.id)}">Editar</button><button class="btn sm" type="button" data-act="regla-mover" data-dir="-1" data-id="${esc(r.id)}"${i === 0 ? ' disabled' : ''} aria-label="Subir ${esc(r.titulo)}">↑</button><button class="btn sm" type="button" data-act="regla-mover" data-dir="1" data-id="${esc(r.id)}"${i === rs.length - 1 ? ' disabled' : ''} aria-label="Bajar ${esc(r.titulo)}">↓</button><button class="btn sm danger" type="button" data-act="regla-borrar" data-id="${esc(r.id)}">Borrar</button></div>` : ''}</div></li>`).join('')
    : `<li class="vacia"><div><p>${ed ? 'Todavía no hay reglas. Agregá la primera con el botón de abajo.' : 'Las reglas se están actualizando.'}</p></div></li>`;
  $('#reglasAcc').hidden = !ed;
}
function formRegla(r) {
  r = r || {};
  formulario({
    titulo: r.id ? 'Editar regla' : 'Nueva regla', texto: 'Se publica al toque en la sección Reglas.', boton: r.id ? 'Guardar cambios' : 'Agregar regla',
    campos: [
      { n: 'titulo', l: 'Título', v: r.titulo, req: true, max: 60 },
      { n: 'texto', l: 'Qué dice la regla', t: 'textarea', v: r.texto, req: true, max: 600 },
      { n: 'nota', l: 'Aclaración (opcional)', v: r.nota, max: 200, ph: 'Ej.: Esta regla todavía está en prueba.' },
      { n: 'destacada', l: 'Estilo', t: 'select', v: r.destacada === '1' ? '1' : '', opc: [{ v: '', l: 'Normal' }, { v: '1', l: 'Destacada (como la del Escuadrón Élite)' }] }
    ],
    enviar: async v => { await accion('reglaGuardar', { id: r.id || '', titulo: v.titulo, texto: v.texto, nota: v.nota, destacada: v.destacada }, r.id ? 'Regla actualizada' : 'Regla agregada'); }
  });
}

// ---------- Contacto y mensajes ----------
function pintarMensajes(lista) {
  const d = $('#dlgLista');
  d.innerHTML = `<div class="dlg"><div class="dlg-cab"><p class="muted">Panel</p><h2>Mensajes de contacto</h2><button class="x" type="button" data-cerrar aria-label="Cerrar">✕</button></div>
    <div class="dlg-cuerpo">${lista.length ? `<ul class="mensajes">${lista.map(m => `<li><div class="msj-cab"><span class="pill">${esc(m.motivo || 'Consulta')}</span><time>${esc(fecha(m.fecha))}</time></div>
      <p class="msj-de">${esc(m.nombre || 'Sin nombre')}${m.contacto ? ' · ' + esc(m.contacto) : ''}</p><p class="msj-t">${esc(m.mensaje)}</p>
      <div class="acc"><button class="btn sm danger" type="button" data-act="borrar-mensaje" data-id="${esc(m.id)}">Borrar</button></div></li>`).join('')}</ul>`
      : '<p class="muted">No hay mensajes. Cuando alguien escriba desde “Aviso legal y privacidad”, aparece acá y en la pestaña Contacto de la planilla.</p>'}</div></div>`;
  abrir(d);
}
async function verMensajes() {
  const d = $('#dlgLista');
  d.innerHTML = '<div class="dlg"><div class="dlg-cuerpo"><p class="muted">Cargando mensajes…</p></div></div>'; abrir(d);
  try { pintarMensajes(await llamar('mensajes')); } catch (e) { cerrar(d); toast(e.message, 'error'); }
}
(() => {
  const f = $('#formContacto'); if (!f) return;
  const err = $('.form-error', f), b = $('[type=submit]', f);
  f.onsubmit = async ev => {
    ev.preventDefault(); err.textContent = '';
    const v = n => f.elements[n].value;
    if (v('mensaje').trim().length < 10) { err.textContent = 'Contanos un poco más en el mensaje.'; f.elements.mensaje.focus(); return; }
    b.disabled = true; const t0 = b.textContent; b.textContent = 'Enviando…';
    try {
      await llamar('contacto', { motivo: v('motivo'), nombre: v('nombre'), contacto: v('contacto'), mensaje: v('mensaje'), web: v('web') });
      f.classList.add('enviado');
      const ok = document.createElement('p'); ok.className = 'contacto-ok'; ok.setAttribute('role', 'status');
      ok.textContent = 'Mensaje enviado. Gracias: la administración lo va a revisar' + (v('contacto').trim() ? ' y te responde por el medio que dejaste.' : '.');
      err.before(ok);
    } catch (e) { err.textContent = e.message; }
    finally { b.disabled = false; b.textContent = t0; }
  };
  document.addEventListener('click', ev => { if (ev.target.closest('[data-contacto]')) setTimeout(() => f.elements.mensaje.focus({ preventScroll: true }), 450); });
  if (location.hash === '#contacto') setTimeout(() => { f.scrollIntoView({ block: 'center' }); f.elements.mensaje.focus({ preventScroll: true }); }, 400);
})();

// ---------- Horario de conquistas (referencia: hora de Cuba) ----------
const HORARIO = {
  tz: 'America/Havana',
  franjas: [
    { id: 'semana', nombre: 'Lun a vie', dias: [1, 2, 3, 4, 5], desde: 19 * 60, hasta: 23 * 60 },
    { id: 'finde', nombre: 'Sáb y dom', dias: [6, 0], desde: 15 * 60, hasta: 23 * 60 }
  ],
  paises: [
    ['Cuba', 'America/Havana'], ['México', 'America/Mexico_City'], ['Centroamérica', 'America/Tegucigalpa'],
    ['Colombia · Perú · Ecuador', 'America/Bogota'], ['Venezuela · Bolivia', 'America/Caracas'],
    ['Rep. Dominicana · Puerto Rico', 'America/Santo_Domingo'], ['Chile', 'America/Santiago'],
    ['Argentina · Uruguay · Paraguay', 'America/Argentina/Buenos_Aires'], ['España', 'Europe/Madrid']
  ]
};
const PAIS_TZ = { 'America/Havana': 'Cuba', 'America/Mexico_City': 'México', 'America/Monterrey': 'México', 'America/Merida': 'México', 'America/Cancun': 'México', 'America/Tijuana': 'México', 'America/Chihuahua': 'México', 'America/Hermosillo': 'México', 'America/Mazatlan': 'México', 'America/Tegucigalpa': 'Honduras', 'America/Guatemala': 'Guatemala', 'America/El_Salvador': 'El Salvador', 'America/Managua': 'Nicaragua', 'America/Costa_Rica': 'Costa Rica', 'America/Panama': 'Panamá', 'America/Bogota': 'Colombia', 'America/Lima': 'Perú', 'America/Guayaquil': 'Ecuador', 'America/Caracas': 'Venezuela', 'America/La_Paz': 'Bolivia', 'America/Santo_Domingo': 'Rep. Dominicana', 'America/Puerto_Rico': 'Puerto Rico', 'America/Santiago': 'Chile', 'America/Montevideo': 'Uruguay', 'America/Asuncion': 'Paraguay', 'Europe/Madrid': 'España', 'America/New_York': 'EE. UU. (este)', 'America/Chicago': 'EE. UU. (centro)', 'America/Los_Angeles': 'EE. UU. (oeste)' };
const paisTz = tz => PAIS_TZ[tz] || (/^America\/(Argentina\/|Buenos_Aires$|Cordoba$|Mendoza$|Catamarca$|Jujuy$|Rosario$)/.test(tz) ? 'Argentina' : '');
const DIAS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
function partesTz(tz, d) {
  const p = {};
  new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }).formatToParts(d).forEach(x => { p[x.type] = x.value; });
  return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday) };
}
function desfaseTz(tz, d) { const p = partesTz(tz, d); return Math.round((Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi) - d.getTime()) / 60000); }
const hhmm = m => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
function franjaEn(f, tz, ahora) {
  const dif = desfaseTz(tz, ahora) - desfaseTz(HORARIO.tz, ahora), a = f.desde + dif, b = f.hasta + dif;
  const nota = a >= 1440 ? 'día siguiente' : a < 0 ? 'día anterior' : '';
  return { texto: hhmm(a) + ' a ' + hhmm(b), corto: hhmm(a) + '–' + hhmm(b), nota, dif };
}
function estadoConquistas(ahora) {
  const c = partesTz(HORARIO.tz, ahora), min = c.h * 60 + c.mi;
  for (let k = 0; k < 8; k++) {
    const wd = (c.wd + k) % 7, f = HORARIO.franjas.find(x => x.dias.includes(wd));
    if (!f) continue;
    if (k === 0 && min >= f.desde && min < f.hasta) return { abierto: true, f, falta: f.hasta - min };
    if (k > 0 || min < f.desde) {
      const falta = k * 1440 + f.desde - min;
      return { abierto: false, f, k, wd, falta, inicio: new Date(Math.floor(ahora.getTime() / 60000) * 60000 + falta * 60000) };
    }
  }
}
const duracion = m => m < 60 ? m + ' min' : Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '');
function pintarHorario() {
  const ahora = new Date(), e = estadoConquistas(ahora); if (!e) return;
  let miTz = ''; try { miTz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (err) { }
  const mismoQueCuba = !miTz || desfaseTz(miTz, ahora) === desfaseTz(HORARIO.tz, ahora);
  const horaLocal = d => new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
  let txt, corto;
  if (e.abierto) {
    const cierre = new Date(Math.floor(ahora.getTime() / 60000) * 60000 + e.falta * 60000);
    txt = 'Conquistas abiertas · cierran a las ' + hhmm(e.f.hasta) + ' de Cuba' + (mismoQueCuba ? '' : ' (' + horaLocal(cierre) + ' en tu hora)');
    corto = 'Conquistas abiertas ahora · quedan ' + duracion(e.falta);
  } else {
    const relativo = (dias, wd) => dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : 'el ' + DIAS_ES[wd];
    const cuandoCuba = e.falta < 60 ? 'en ' + e.falta + ' min' : relativo(e.k, e.wd);
    let cuandoTu = cuandoCuba;
    if (!mismoQueCuba && e.falta >= 60) {
      const a = partesTz(miTz, ahora), b = partesTz(miTz, e.inicio);
      const dias = Math.round((Date.UTC(b.y, b.mo - 1, b.d) - Date.UTC(a.y, a.mo - 1, a.d)) / 864e5);
      cuandoTu = relativo(dias, b.wd);
    }
    const aLas = e.falta < 60 ? '' : ' a las ' + hhmm(e.f.desde) + ' de Cuba';
    txt = 'Cerradas · abren ' + cuandoCuba + aLas + (mismoQueCuba || e.falta < 60 ? '' : ' (' + (cuandoTu !== cuandoCuba ? cuandoTu + ' ' : '') + horaLocal(e.inicio) + ' en tu hora)');
    corto = 'Próximas conquistas: ' + cuandoTu + (e.falta < 60 ? '' : ', ' + (mismoQueCuba ? hhmm(e.f.desde) + ' de Cuba' : horaLocal(e.inicio) + ' en tu hora'));
  }
  const est = $('#hzEstado'), chip = $('#hzHero');
  if (est) { est.classList.toggle('on', e.abierto); est.lastElementChild.textContent = txt; }
  if (chip) { chip.classList.toggle('on', e.abierto); chip.lastElementChild.textContent = corto; }
  const hoyCuba = partesTz(HORARIO.tz, ahora).wd;
  $$('.franja[data-franja]').forEach(el => el.classList.toggle('hoy', HORARIO.franjas.some(f => f.id === el.dataset.franja && f.dias.includes(hoyCuba))));
  const tu = $('#hzTu');
  if (tu) {
    tu.hidden = mismoQueCuba;
    if (!mismoQueCuba) {
      const pais = paisTz(miTz);
      tu.innerHTML = '<small>En tu hora' + (pais ? ' · ' + esc(pais) : '') + '</small><div class="tu-l">' + HORARIO.franjas.map(f => { const r = franjaEn(f, miTz, ahora); return '<span>' + f.nombre + '</span><b>' + r.texto + (r.nota ? ' <em class="nota">(' + r.nota + ')</em>' : '') + '</b>'; }).join('') + '</div><span>Se calcula con el horario de tu dispositivo.</span>';
    }
  }
  const tabla = $('#hzTabla');
  if (tabla && !tabla.dataset.listo) {
    tabla.dataset.listo = '1';
    tabla.innerHTML = '<thead><tr><th>País</th>' + HORARIO.franjas.map(f => '<th>' + f.nombre + '</th>').join('') + '</tr></thead><tbody>' + HORARIO.paises.map(([n, tz]) => {
      const es = miTz && (tz === miTz || desfaseTz(tz, ahora) === desfaseTz(miTz, ahora) && paisTz(miTz) && n.includes(paisTz(miTz)));
      return '<tr' + (es ? ' class="es-tu"' : '') + '><td>' + esc(n) + '</td>' + HORARIO.franjas.map(f => { const r = franjaEn(f, tz, ahora); return '<td><span class="hz-h">' + r.corto + '</span>' + (r.nota ? ' <em class="nota">' + r.nota + '</em>' : '') + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody>';
  }
}
try { pintarHorario(); } catch (err) { }
setInterval(() => { if (!document.hidden) try { pintarHorario(); } catch (err) { } }, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) try { pintarHorario(); } catch (err) { } });

// ---------- Arranque ----------
if (MULTIPAGINA) {
  const h = location.hash, mw = h.match(/^#wiki\/([\w-]+)/), mh = h.match(/^#([a-z]+)$/);
  if (mw && !hay('#gridWiki') && !hay('#wikiArticulo')) location.replace('/wiki/' + mw[1] + '.html');
  else if (/^#carnet\//.test(h) && !hay('#gridCarnets')) location.replace('/carnets.html' + h);
  const mpk = location.pathname.match(/^\/pokemon\/([\w-]+)\.html$/);
  if (mpk && !hay('#pkPagina')) location.replace('/wiki/pokedex.html#pokemon/' + mpk[1]);
  else if (mh && !document.getElementById(mh[1]) && PAGINA_DE[mh[1]] && mh[1] !== 'admin') location.replace(PAGINA_DE[mh[1]]);
}
S.token = almacen.get('rlo-token'); S.rol = S.token ? (almacen.get('rlo-rol') || 'admin') : '';
if (MODO === 'demo' && S.token !== 'demo-token') { S.token = ''; S.rol = ''; }
const quiereAdmin = /(^|[?&#])admin\b/.test(location.search + location.hash) || /\/admin\/?$/.test(location.pathname) || window.__ADMIN__;
let guardado = null;
if (MODO !== 'demo') try { guardado = JSON.parse(localStorage.getItem('rlo-cache-v1') || 'null'); } catch (e) { }
if (window.__INICIAL__ && window.__INICIAL__.equipos) { S.d = window.__INICIAL__; S.cargando = false; render(); if (S.token) cargar(true); }
else if (guardado && guardado.equipos && !S.token) { S.d = guardado; S.cargando = false; render(); cargar(true); }
else { render(); cargar(); }
if (MODO !== 'demo' && hay('#gridCarnets')) try { const cc = JSON.parse(localStorage.getItem('rlo-carnets-v1') || 'null'); if (Array.isArray(cc)) { S.carnets = cc; renderCarnets(); } } catch (e) { }
if (quiereAdmin && !S.token) setTimeout(entrarAdmin, 300);
setTimeout(rutaCarnet, 150);
setTimeout(rutaWiki, 160);
setTimeout(rutaPokemon, 170);
window.addEventListener('hashchange', () => { if (/^#admin\b/.test(location.hash) && !S.token) entrarAdmin(); });
if (MODO !== 'demo') setInterval(() => { if (!document.hidden && !$('dialog[open]') && !S.ubicando) cargar(true); }, 90000);
