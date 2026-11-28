/**
 * =====================================================================
 * RESIGEST 360 - CATÁLOGO Y VALIDACIÓN DE PROVINCIAS Y MUNICIPIOS (INE)
 * =====================================================================
 * Proporciona las 52 provincias españolas con sus códigos INE / CP (01-52),
 * municipios asociados por provincia y funciones de dependencia bidireccional:
 * - Al seleccionar provincia -> filtra los municipios de esa provincia.
 * - Al seleccionar municipio -> autocompleta automáticamente su provincia.
 * - Al introducir código postal (5 dígitos) -> detecta provincia por los 2 primeros dígitos.
 */

export interface ProvinceItem {
  code: string; // '01' .. '52'
  name: string;
}

export const SPAIN_PROVINCES: ProvinceItem[] = [
  { code: '01', name: 'Álava' },
  { code: '02', name: 'Albacete' },
  { code: '03', name: 'Alicante' },
  { code: '04', name: 'Almería' },
  { code: '05', name: 'Ávila' },
  { code: '06', name: 'Badajoz' },
  { code: '07', name: 'Illes Balears' },
  { code: '08', name: 'Barcelona' },
  { code: '09', name: 'Burgos' },
  { code: '10', name: 'Cáceres' },
  { code: '11', name: 'Cádiz' },
  { code: '12', name: 'Castellón' },
  { code: '13', name: 'Ciudad Real' },
  { code: '14', name: 'Córdoba' },
  { code: '15', name: 'A Coruña' },
  { code: '16', name: 'Cuenca' },
  { code: '17', name: 'Girona' },
  { code: '18', name: 'Granada' },
  { code: '19', name: 'Guadalajara' },
  { code: '20', name: 'Gipuzkoa' },
  { code: '21', name: 'Huelva' },
  { code: '22', name: 'Huesca' },
  { code: '23', name: 'Jaén' },
  { code: '24', name: 'León' },
  { code: '25', name: 'Lleida' },
  { code: '26', name: 'La Rioja' },
  { code: '27', name: 'Lugo' },
  { code: '28', name: 'Madrid' },
  { code: '29', name: 'Málaga' },
  { code: '30', name: 'Murcia' },
  { code: '31', name: 'Navarra' },
  { code: '32', name: 'Ourense' },
  { code: '33', name: 'Asturias' },
  { code: '34', name: 'Palencia' },
  { code: '35', name: 'Las Palmas' },
  { code: '36', name: 'Pontevedra' },
  { code: '37', name: 'Salamanca' },
  { code: '38', name: 'Santa Cruz de Tenerife' },
  { code: '39', name: 'Cantabria' },
  { code: '40', name: 'Segovia' },
  { code: '41', name: 'Sevilla' },
  { code: '42', name: 'Soria' },
  { code: '43', name: 'Tarragona' },
  { code: '44', name: 'Teruel' },
  { code: '45', name: 'Toledo' },
  { code: '46', name: 'Valencia' },
  { code: '47', name: 'Valladolid' },
  { code: '48', name: 'Bizkaia' },
  { code: '49', name: 'Zamora' },
  { code: '50', name: 'Zaragoza' },
  { code: '51', name: 'Ceuta' },
  { code: '52', name: 'Melilla' },
];

/**
 * Alias habituales de nombres de provincias para normalización.
 */
const PROVINCE_ALIASES: Record<string, string> = {
  araba: 'Álava',
  alava: 'Álava',
  baleares: 'Illes Balears',
  'islas baleares': 'Illes Balears',
  'illes balears': 'Illes Balears',
  coruna: 'A Coruña',
  'la coruna': 'A Coruña',
  'a coruna': 'A Coruña',
  gerona: 'Girona',
  girona: 'Girona',
  guipuzcoa: 'Gipuzkoa',
  gipuzkoa: 'Gipuzkoa',
  lerida: 'Lleida',
  lleida: 'Lleida',
  rioja: 'La Rioja',
  'la rioja': 'La Rioja',
  orense: 'Ourense',
  ourense: 'Ourense',
  'las palmas': 'Las Palmas',
  tenerife: 'Santa Cruz de Tenerife',
  'santa cruz de tenerife': 'Santa Cruz de Tenerife',
  vizcaya: 'Bizkaia',
  bizkaia: 'Bizkaia',
  castello: 'Castellón',
  castellon: 'Castellón',
  alacant: 'Alicante',
  alicante: 'Alicante',
};

/**
 * Municipios agrupados por nombre oficial de provincia.
 */
export const MUNICIPALITIES_BY_PROVINCE: Record<string, string[]> = {
  'Álava': [
    'Amurrio', 'Ayala', 'Agurain/Salvatierra', 'Laguardia', 'Laudio/Llodio', 'Oyón-Oion', 'Vitoria-Gasteiz',
  ],
  'Albacete': [
    'Albacete', 'Almansa', 'Caudete', 'Hellín', 'La Roda', 'Tobarra', 'Villarrobledo',
  ],
  'Alicante': [
    'Alcoy', 'Alicante', 'Altea', 'Aspe', 'Benidorm', 'Calp', 'Crevillent', 'Dénia', 'El Campello',
    'Elche', 'Elda', 'Guardamar del Segura', 'Ibi', 'Jávea/Xàbia', 'Mutxamel', 'Novelda', 'Orihuela',
    'Petrer', 'Pilar de la Horadada', 'San Vicente del Raspeig', 'Santa Pola', 'Torrevieja', 'Villajoyosa', 'Villena',
  ],
  'Almería': [
    'Adra', 'Albox', 'Almería', 'Berja', 'Cuevas del Almanzora', 'El Ejido', 'Garrucha', 'Huércal de Almería',
    'Huércal-Overa', 'La Mojonera', 'Macael', 'Mojácar', 'Níjar', 'Pulpí', 'Roquetas de Mar', 'Vera', 'Vícar',
  ],
  'Ávila': [
    'Arenas de San Pedro', 'Arévalo', 'Ávila', 'Candeleda', 'Cebreros', 'El Barco de Ávila', 'El Tiemblo', 'Las Navas del Marqués',
  ],
  'Badajoz': [
    'Almendralejo', 'Azuaga', 'Badajoz', 'Castuera', 'Don Benito', 'Jerez de los Caballeros', 'Llerena',
    'Mérida', 'Montijo', 'Olivenza', 'Villafranca de los Barros', 'Villanueva de la Serena', 'Zafra',
  ],
  'Illes Balears': [
    'Alcudia', 'Calvià', 'Ciutadella de Menorca', 'Eivissa', 'Felanitx', 'Inca', 'Llucmajor', 'Manacor',
    'Maó-Mahón', 'Marratxí', 'Palma', 'Pollença', 'Sant Antoni de Portmany', 'Santa Eulària des Riu', 'Sóller',
  ],
  'Barcelona': [
    'Badalona', 'Barberà del Vallès', 'Barcelona', 'Castelldefels', 'Cerdanyola del Vallès', 'Cornellà de Llobregat',
    'El Prat de Llobregat', 'Esplugues de Llobregat', 'Gavà', 'Granollers', 'Hospitalet de Llobregat', 'Igualada',
    'Manresa', 'Martorell', 'Mataró', 'Mollet del Vallès', 'Montcada i Reixac', 'Rubí', 'Sabadell',
    'Sant Adrià de Besòs', 'Sant Boi de Llobregat', 'Sant Cugat del Vallès', 'Sant Feliu de Llobregat',
    'Santa Coloma de Gramenet', 'Terrassa', 'Vic', 'Viladecans', 'Vilafranca del Penedès', 'Vilanova i la Geltrú',
  ],
  'Burgos': [
    'Aranda de Duero', 'Briviesca', 'Burgos', 'Lerma', 'Medina de Pomar', 'Miranda de Ebro', 'Villarcayo',
  ],
  'Cáceres': [
    'Cáceres', 'Coria', 'Jaraíz de la Vera', 'Miajadas', 'Moraleja', 'Navalmoral de la Mata', 'Plasencia', 'Trujillo', 'Valencia de Alcántara',
  ],
  'Cádiz': [
    'Alcalá de los Gazules', 'Alcalá del Valle', 'Algar', 'Algeciras', 'Algodonales', 'Arcos de la Frontera',
    'Barbate', 'Benalup-Casas Viejas', 'Benaocaz', 'Bornos', 'El Bosque', 'Cádiz', 'Castellar de la Frontera',
    'Chiclana de la Frontera', 'Chipiona', 'Conil de la Frontera', 'El Gastor', 'El Puerto de Santa María',
    'Espera', 'Grazalema', 'Jerez de la Frontera', 'Jimena de la Frontera', 'La Línea de la Concepción',
    'Los Barrios', 'Medina-Sidonia', 'Olvera', 'Paterna de Rivera', 'Prado del Rey', 'Puerto Real',
    'Puerto Serrano', 'Rota', 'San Fernando', 'San José del Valle', 'San Martín del Tesorillo',
    'San Roque', 'Sanlúcar de Barrameda', 'Setenil de las Bodegas', 'Tarifa', 'Torre Alháquime',
    'Trebujena', 'Ubrique', 'Vejer de la Frontera', 'Villaluenga del Rosario', 'Villamartín', 'Zahara',
  ],
  'Castellón': [
    'Almassora', 'Benicarló', 'Benicàssim', 'Borriana/Burriana', 'Castellón de la Plana', 'La Vall d\'Uixó',
    'Nules', 'Onda', 'Segorbe', 'Vila-real', 'Vinaròs',
  ],
  'Ciudad Real': [
    'Alcázar de San Juan', 'Almadén', 'Almagro', 'Bolaños de Calatrava', 'Campo de Criptana', 'Ciudad Real',
    'Daimiel', 'La Solana', 'Manzanares', 'Miguelturra', 'Puertollano', 'Socuéllamos', 'Tomelloso', 'Valdepeñas', 'Villarrobledo',
  ],
  'Córdoba': [
    'Aguilar de la Frontera', 'Baena', 'Bujalance', 'Cabra', 'Castro del Río', 'Córdoba', 'Fuente Palmera',
    'Hinojosa del Duque', 'La Carlota', 'La Rambla', 'Lucena', 'Montilla', 'Montoro', 'Palma del Río',
    'Peñarroya-Pueblonuevo', 'Posadas', 'Pozoblanco', 'Priego de Córdoba', 'Puente Genil', 'Rute', 'Villanueva de Córdoba',
  ],
  'A Coruña': [
    'A Coruña', 'Ames', 'Arteixo', 'Betanzos', 'Boiro', 'Cambre', 'Carballo', 'Culleredo', 'Ferrol',
    'Narón', 'Noia', 'Oleiros', 'Ordes', 'Ribeira', 'Sada', 'Santiago de Compostela', 'Teo',
  ],
  'Cuenca': [
    'Cuenca', 'Las Pedroñeras', 'Mota del Cuervo', 'Motilla del Palancar', 'Quintanar del Rey', 'San Clemente', 'Tarancón',
  ],
  'Girona': [
    'Banyoles', 'Blanes', 'Castell-Platja d\'Aro', 'Figueres', 'Girona', 'La Bisbal d\'Empordà',
    'Lloret de Mar', 'Olot', 'Palafrugell', 'Palamós', 'Puigcerdà', 'Ripoll', 'Roses', 'Salt', 'Sant Feliu de Guíxols',
  ],
  'Granada': [
    'Albolote', 'Almuñécar', 'Armilla', 'Atarfe', 'Baza', 'Churriana de la Vega', 'Cullar Vega', 'Gójar',
    'Granada', 'Guadix', 'Huétor Tájar', 'Huétor Vega', 'Íllora', 'La Zubia', 'Las Gabias', 'Loja',
    'Maracena', 'Motril', 'Ogíjares', 'Peligros', 'Pinos Puente', 'Salobreña', 'Santa Fe', 'Vegas del Genil',
  ],
  'Guadalajara': [
    'Azuqueca de Henares', 'Cabanillas del Campo', 'El Casar', 'Guadalajara', 'Marchamalo', 'Molina de Aragón', 'Sigüenza', 'Villanueva de la Torre',
  ],
  'Gipuzkoa': [
    'Arrasate/Mondragón', 'Azkoitia', 'Azpeitia', 'Beasain', 'Bergara', 'Donostia/San Sebastián', 'Eibar',
    'Elgoibar', 'Errenteria', 'Hernani', 'Hondarribia', 'Irun', 'Lasarte-Oria', 'Oñati', 'Ordizia', 'Pasaia', 'Tolosa', 'Zarautz', 'Zumaia',
  ],
  'Huelva': [
    'Aljaraque', 'Almonte', 'Aracena', 'Ayamonte', 'Bollullos Par del Condado', 'Bonares', 'Cartaya',
    'Cortegana', 'Gibraleón', 'Huelva', 'Isla Cristina', 'La Palma del Condado', 'Lepe', 'Moguer',
    'Nerva', 'Palos de la Frontera', 'Punta Umbría', 'Rociana del Condado', 'San Juan del Puerto', 'Trigueros', 'Valverde del Camino',
  ],
  'Huesca': [
    'Barbastro', 'Binéfar', 'Fraga', 'Huesca', 'Jaca', 'Monzón', 'Sabiñánigo', 'Sariñena', 'Tamarite de Litera',
  ],
  'Jaén': [
    'Alcalá la Real', 'Alcaudete', 'Andújar', 'Baeza', 'Bailén', 'Beas de Segura', 'Carolina (La)', 'Cazorla',
    'Jaén', 'Jódar', 'Linares', 'Mancha Real', 'Martos', 'Mengíbar', 'Porcuna', 'Torredelcampo',
    'Torredonjimeno', 'Úbeda', 'Villacarrillo', 'Villanueva del Arzobispo',
  ],
  'León': [
    'Astorga', 'Bembibre', 'Cacabelos', 'La Bañeza', 'León', 'Ponferrada', 'San Andrés del Rabanedo', 'Valencia de Don Juan', 'Villablino', 'Villaquilambre',
  ],
  'Lleida': [
    'Almacelles', 'Alpicat', 'Balaguer', 'Cervera', 'La Seu d\'Urgell', 'Les Borges Blanques', 'Lleida', 'Mollerussa', 'Solsona', 'Tàrrega', 'Tremp', 'Vielha e Mijaran',
  ],
  'La Rioja': [
    'Alfaro', 'Arnedo', 'Calahorra', 'Haro', 'Lardero', 'Logroño', 'Nájera', 'Santo Domingo de la Calzada', 'Villamediana de Iregua',
  ],
  'Lugo': [
    'Burela', 'Chantada', 'Foz', 'Guitiriz', 'Lugo', 'Monforte de Lemos', 'Ribadeo', 'Sarria', 'Vilalba', 'Viveiro',
  ],
  'Madrid': [
    'Alcalá de Henares', 'Alcobendas', 'Alcorcón', 'Algete', 'Aranjuez', 'Arganda del Rey', 'Boadilla del Monte',
    'Ciempozuelos', 'Collado Villalba', 'Colmenar Viejo', 'Coslada', 'El Escorial', 'Fuenlabrada', 'Galapagar',
    'Getafe', 'Humanes de Madrid', 'Las Rozas de Madrid', 'Leganés', 'Madrid', 'Majadahonda', 'Mejorada del Campo',
    'Móstoles', 'Navalcarnero', 'Paracuellos de Jarama', 'Parla', 'Pinto', 'Pozuelo de Alarcón', 'Rivas-Vaciamadrid',
    'San Fernando de Henares', 'San Lorenzo de El Escorial', 'San Martín de la Vega', 'San Sebastián de los Reyes',
    'Torrejón de Ardoz', 'Torrelodones', 'Tres Cantos', 'Valdemoro', 'Villanueva de la Cañada', 'Villaviciosa de Odón',
  ],
  'Málaga': [
    'Alameda', 'Alhaurín de la Torre', 'Alhaurín el Grande', 'Álora', 'Antequera', 'Archidona', 'Benahavís',
    'Benalmádena', 'Campillos', 'Cártama', 'Casares', 'Coín', 'Estepona', 'Fuengirola', 'Málaga', 'Manilva',
    'Marbella', 'Mijas', 'Mollina', 'Nerja', 'Pizarra', 'Rincón de la Victoria', 'Ronda', 'Torremolinos', 'Torrox', 'Vélez-Málaga',
  ],
  'Murcia': [
    'Águilas', 'Alcantarilla', 'Alhama de Murcia', 'Archena', 'Beniel', 'Bullas', 'Calasparra', 'Caravaca de la Cruz',
    'Cartagena', 'Cehegín', 'Ceutí', 'Cieza', 'Fortuna', 'Fuente Álamo de Murcia', 'Jumilla', 'La Unión',
    'Las Torres de Cotillas', 'Lorca', 'Los Alcázares', 'Mazarrón', 'Molina de Segura', 'Mula', 'Murcia',
    'Puerto Lumbreras', 'San Javier', 'San Pedro del Pinatar', 'Santomera', 'Torre-Pacheco', 'Totana', 'Yecla',
  ],
  'Navarra': [
    'Altsasu/Alsasua', 'Ansoáin', 'Barañáin', 'Baztan', 'Berriozar', 'Burlada', 'Cintruénigo', 'Corella',
    'Egüés', 'Estella-Lizarra', 'Noáin', 'Pamplona/Iruña', 'Peralta', 'San Adrián', 'Sangüesa', 'Tafalla', 'Tudela', 'Villava', 'Zizur Mayor',
  ],
  'Ourense': [
    'Allariz', 'A Rúa', 'Celanova', 'O Barco de Valdeorras', 'O Carballiño', 'Ourense', 'Pereiro de Aguiar', 'Ribadavia', 'Verín', 'Xinzo de Limia',
  ],
  'Asturias': [
    'Aller', 'Avilés', 'Cangas del Narcea', 'Cangas de Onís', 'Carreño', 'Castrillón', 'Corvera de Asturias',
    'Gijón', 'Grado', 'Langreo', 'Laviana', 'Lena', 'Llanes', 'Llanera', 'Luarca/Valdés', 'Mieres',
    'Navia', 'Noreña', 'Oviedo', 'Pravia', 'Ribadesella', 'San Martín del Rey Aurelio', 'Siero', 'Tineo', 'Villaviciosa',
  ],
  'Palencia': [
    'Aguilar de Campoo', 'Cervera de Pisuerga', 'Dueñas', 'Guardo', 'Herrera de Pisuerga', 'Palencia', 'Saldaña', 'Venta de Baños', 'Villamuriel de Cerrato',
  ],
  'Las Palmas': [
    'Agüimes', 'Antigua', 'Arecife', 'Arucas', 'Gáldar', 'Ingenio', 'La Oliva', 'Las Palmas de Gran Canaria',
    'Mogán', 'Pájara', 'Puerto del Rosario', 'San Bartolomé', 'San Bartolomé de Tirajana', 'Santa Brígida',
    'Santa Lucía de Tirajana', 'Teguise', 'Telde', 'Teror', 'Tías', 'Tuineje',
  ],
  'Pontevedra': [
    'A Estrada', 'Baiona', 'Bueu', 'Cambados', 'Cangas', 'Gondomar', 'Lalín', 'Marín', 'Moaña', 'Mos',
    'Nigrán', 'O Grove', 'O Porriño', 'Poio', 'Ponteareas', 'Pontevedra', 'Redondela', 'Salceda de Caselas',
    'Sanxenxo', 'Tomiño', 'Tui', 'Vilagarcía de Arousa', 'Vigo',
  ],
  'Salamanca': [
    'Alba de Tormes', 'Béjar', 'Carbajosa de la Sagrada', 'Ciudad Rodrigo', 'Guijuelo', 'Peñaranda de Bracamonte',
    'Salamanca', 'Santa Marta de Tormes', 'Villamayor', 'Vitigudino',
  ],
  'Santa Cruz de Tenerife': [
    'Adeje', 'Arona', 'Candelaria', 'Granadilla de Abona', 'Güímar', 'Guía de Isora', 'Icod de los Vinos',
    'La Orotava', 'Los Llanos de Aridane', 'Los Realejos', 'Puerto de la Cruz', 'San Cristóbal de La Laguna',
    'San Miguel de Abona', 'Santa Cruz de La Palma', 'Santa Cruz de Tenerife', 'Santa Úrsula', 'Santiago del Teide', 'Tacoronte',
  ],
  'Cantabria': [
    'Astillero (El)', 'abezón de la Sal', 'Camargo', 'Castro-Urdiales', 'Colindres', 'Corrales de Buelna (Los)',
    'Laredo', 'Marina de Cudeyo', 'Piélagos', 'Reinosa', 'Reocín', 'Santander', 'Santa Cruz de Bezana',
    'Santa María de Cayón', 'Santoña', 'San Vicente de la Barquera', 'Suances', 'Torrelavega',
  ],
  'Segovia': [
    'Cantalejo', 'Carbonero el Mayor', 'Cuéllar', 'El Espinar', 'La Lastrilla', 'Palazuelos de Eresma', 'Real Sitio de San Ildefonso', 'Riaza', 'Segovia',
  ],
  'Sevilla': [
    'Alcalá de Guadaíra', 'Alcalá del Río', 'Almensilla', 'Arahal', 'Bollullos de la Mitación', 'Bormujos',
    'Brenes', 'Camas', 'Cantillana', 'Carmona', 'Castilleja de la Cuesta', 'Cazalla de la Sierra',
    'Constantina', 'Coria del Río', 'Dos Hermanas', 'Écija', 'El Cuervo de Sevilla', 'El Viso del Alcor',
    'Espartinas', 'Estepa', 'Gelves', 'Gerena', 'Gines', 'Guillena', 'Herrera', 'La Algaba', 'La Puebla de Cazalla',
    'La Puebla del Río', 'La Rinconada', 'Las Cabezas de San Juan', 'Lebrija', 'Lora del Río', 'Los Palacios y Villafranca',
    'Mairena del Alcor', 'Mairena del Aljarafe', 'Marchena', 'Morón de la Frontera', 'Olivares', 'Osuna',
    'Palomares del Río', 'Paradas', 'Pilas', 'San Juan de Aznalfarache', 'Sanlúcar la Mayor', 'Santiponce',
    'Sevilla', 'Tocina', 'Tomares', 'Umbrete', 'Utrera', 'Valencina de la Concepción', 'Villaverde del Río',
  ],
  'Soria': [
    'Ágreda', 'Almazán', 'El Burgo de Osma-Ciudad de Osma', 'Ólvega', 'San Esteban de Gormaz', 'San Leonardo de Yagüe', 'Soria',
  ],
  'Tarragona': [
    'Alcanar', 'Amposta', 'Calafell', 'Cambrils', 'Cunit', 'Deltebre', 'El Vendrell', 'Mont-roig del Camp',
    'Reus', 'Salou', 'Sant Carles de la Ràpita', 'Tarragona', 'Torredembarra', 'Tortosa', 'Valls', 'Vila-seca',
  ],
  'Teruel': [
    'Alcañiz', 'Andorra', 'Calamocha', 'Calanda', 'Monreal del Campo', 'Mora de Rubielos', 'Teruel', 'Utrillas',
  ],
  'Toledo': [
    'Bargas', 'Consuegra', 'Fuensalida', 'Illescas', 'La Puebla de Montalbán', 'Madridejos', 'Mora',
    'Ocaña', 'Olías del Rey', 'Quintanar de la Orden', 'Seseña', 'Sonseca', 'Talavera de la Reina',
    'Toledo', 'Torrijos', 'Villacañas', 'Yuncos',
  ],
  'Valencia': [
    'Alaquàs', 'Albal', 'Alboraya', 'Aldaia', 'Alfafar', 'Algemesí', 'Alginet', 'Alzira', 'Benaguasil',
    'Benetússer', 'Bétera', 'Burjassot', 'Canals', 'Carcaixent', 'Catarroja', 'Chiva', 'Cullera', 'El Puig de Santa Maria',
    'Gandia', 'Godella', 'L\'Eliana', 'Llíria', 'Manises', 'Massamagrell', 'Meliana', 'Mislata', 'Moncada',
    'Oliva', 'Ontinyent', 'Paiporta', 'Paterna', 'Picanya', 'Picassent', 'Puçol', 'Quart de Poblet',
    'Requena', 'Riba-roja de Túria', 'Sagunto', 'Sedaví', 'Silla', 'Sueca', 'Tavernes de la Valldigna',
    'Torrent', 'Utiel', 'Valencia', 'Xàtiva', 'Xirivella',
  ],
  'Valladolid': [
    'Arroyo de la Encomienda', 'Boecillo', 'Cabezón de Pisuerga', 'Cigales', 'Íscar', 'Laguna de Duero',
    'Medina de Rioseco', 'Medina del Campo', 'Olmedo', 'Peñafiel', 'Renedo de Esgueva', 'Simancas',
    'Tordesillas', 'Tudela de Duero', 'Valladolid', 'Zaratán',
  ],
  'Bizkaia': [
    'Abadiño', 'Amorebieta-Etxano', 'Arrigorriaga', 'Balmaseda', 'Barakaldo', 'Basauri', 'Berango',
    'Bermeo', 'Bilbao', 'Derio', 'Durango', 'Elorrio', 'Erandio', 'Ermua', 'Etxebarri', 'Galdakao',
    'Gernika-Lumo', 'Getxo', 'Gorliz', 'Gueñes', 'Leioa', 'Lekeitio', 'Mungia', 'Muskiz', 'Ondarroa',
    'Ortuella', 'Portugalete', 'Santurtzi', 'Sestao', 'Sopela', 'Trapagaran', 'Zalla',
  ],
  'Zamora': [
    'Benavente', 'Morales del Vino', 'Puebla de Sanabria', 'Toro', 'Villalpando', 'Zamora',
  ],
  'Zaragoza': [
    'Alagón', 'Borja', 'Calatayud', 'Caspe', 'Cuarte de Huerva', 'Daroca', 'Ejea de los Caballeros',
    'Épila', 'Fuentes de Ebro', 'La Almunia de Doña Godina', 'La Muela', 'María de Huerva', 'Pina de Ebro',
    'Tarazona', 'Tauste', 'Utebo', 'Villanueva de Gállego', 'Zaragoza', 'Zuera',
  ],
  'Ceuta': [
    'Ceuta',
  ],
  'Melilla': [
    'Melilla',
  ],
};

/**
 * Elimina acentos y normaliza texto en minúsculas para comparaciones insensibles.
 */
export function normalizeLocationText(value: string): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Devuelve el nombre oficial de la provincia a partir de su nombre (con o sin tilde, o alias)
 * o su código INE de 2 dígitos. Si no coincide con ninguna provincia española, devuelve null.
 */
export function normalizeProvinceName(rawProvince?: string | null): string | null {
  if (!rawProvince) return null;
  const trimmed = rawProvince.trim();
  if (!trimmed) return null;

  // Si es un código de 2 dígitos ('01'..'52')
  if (/^\d{2}$/.test(trimmed)) {
    const byCode = SPAIN_PROVINCES.find((p) => p.code === trimmed);
    if (byCode) return byCode.name;
  }

  const norm = normalizeLocationText(trimmed);

  // Coincidencia directa en alias
  if (PROVINCE_ALIASES[norm]) {
    return PROVINCE_ALIASES[norm];
  }

  // Coincidencia exacta con nombre de provincia normalizado
  const exactMatch = SPAIN_PROVINCES.find((p) => normalizeLocationText(p.name) === norm);
  if (exactMatch) {
    return exactMatch.name;
  }

  return null;
}

/**
 * Obtiene la provincia a partir de los 2 primeros dígitos de un Código Postal español.
 */
export function getProvinceByPostalCode(postalCode?: string | null): string | null {
  if (!postalCode) return null;
  const digits = postalCode.trim().replace(/\D/g, '');
  if (digits.length < 2) return null;
  const prefix = digits.substring(0, 2);
  const found = SPAIN_PROVINCES.find((p) => p.code === prefix);
  return found ? found.name : null;
}

/**
 * Obtiene la lista de municipios correspondientes a una provincia.
 * Si no se especifica provincia o no se reconoce, retorna todos los municipios ordenados.
 */
export function getMunicipalitiesByProvince(provinceName?: string | null): string[] {
  const canonicalProv = normalizeProvinceName(provinceName);
  if (canonicalProv && MUNICIPALITIES_BY_PROVINCE[canonicalProv]) {
    return [...MUNICIPALITIES_BY_PROVINCE[canonicalProv]].sort((a, b) => a.localeCompare(b, 'es'));
  }

  // Si no hay provincia seleccionada, devolver todos los municipios únicos
  const all = new Set<string>();
  for (const list of Object.values(MUNICIPALITIES_BY_PROVINCE)) {
    for (const m of list) {
      all.add(m);
    }
  }
  return Array.from(all).sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Busca a qué provincia pertenece un municipio dado.
 * Si un municipio coincide exactamente con una única provincia (o con la provincia actual),
 * retorna el nombre canónico de esa provincia.
 */
export function findProvinceByMunicipality(
  municipalityName?: string | null,
  currentProvince?: string | null
): string | null {
  if (!municipalityName) return null;
  const normMuni = normalizeLocationText(municipalityName);
  if (!normMuni) return null;

  // Si ya hay una provincia seleccionada y el municipio pertenece a ella, mantenerla
  const canonicalCurrent = normalizeProvinceName(currentProvince);
  if (canonicalCurrent && MUNICIPALITIES_BY_PROVINCE[canonicalCurrent]) {
    const existsInCurrent = MUNICIPALITIES_BY_PROVINCE[canonicalCurrent].some(
      (m) => normalizeLocationText(m) === normMuni
    );
    if (existsInCurrent) {
      return canonicalCurrent;
    }
  }

  // Buscar en todas las provincias
  for (const [prov, munis] of Object.entries(MUNICIPALITIES_BY_PROVINCE)) {
    if (munis.some((m) => normalizeLocationText(m) === normMuni)) {
      return prov;
    }
  }

  return null;
}

/**
 * Comprueba si un municipio pertenece al catálogo de una provincia determinada.
 * Retorna true si el municipio está en la lista de la provincia o si es un municipio
 * personalizado que no figura en otra provincia distinta del catálogo.
 */
export function isMunicipalityValidForProvince(
  municipalityName?: string | null,
  provinceName?: string | null
): boolean {
  if (!municipalityName || !provinceName) return true;
  const canonicalProv = normalizeProvinceName(provinceName);
  if (!canonicalProv) return true;

  const normMuni = normalizeLocationText(municipalityName);
  const provMunis = MUNICIPALITIES_BY_PROVINCE[canonicalProv] || [];

  // Si está en los municipios de esa provincia, es válido
  if (provMunis.some((m) => normalizeLocationText(m) === normMuni)) {
    return true;
  }

  // Verificar si pertenece inequívocamente a otra provincia distinta del catálogo
  for (const [otherProv, munis] of Object.entries(MUNICIPALITIES_BY_PROVINCE)) {
    if (otherProv !== canonicalProv && munis.some((m) => normalizeLocationText(m) === normMuni)) {
      return false;
    }
  }

  // Si es una localidad menor no listada en otra provincia, permitirlo
  return true;
}

/**
 * Resuelve la actualización dependiente cuando cambia la provincia:
 * Si el municipio actual pertenece a otra provincia distinta, lo limpia ('').
 */
export function resolveProvinceChange(
  newProvince: string,
  currentMunicipality?: string | null
): { provincia: string; municipio: string } {
  const canonicalProv = normalizeProvinceName(newProvince) ?? newProvince;
  const currentMuni = currentMunicipality || '';

  if (!newProvince.trim()) {
    return { provincia: '', municipio: currentMuni };
  }

  if (currentMuni && !isMunicipalityValidForProvince(currentMuni, canonicalProv)) {
    return { provincia: canonicalProv, municipio: '' };
  }

  return { provincia: canonicalProv, municipio: currentMuni };
}

/**
 * Resuelve la actualización dependiente cuando cambia el municipio:
 * Si el municipio pertenece a una provincia conocida del catálogo, autocompleta la provincia.
 */
export function resolveMunicipalityChange(
  newMunicipality: string,
  currentProvince?: string | null
): { provincia: string; municipio: string } {
  const currentProv = currentProvince || '';
  if (!newMunicipality.trim()) {
    return { provincia: currentProv, municipio: '' };
  }

  const detectedProv = findProvinceByMunicipality(newMunicipality, currentProv);
  if (detectedProv) {
    // Usar el nombre canónico del municipio si coincide
    const normMuni = normalizeLocationText(newMunicipality);
    const canonicalMuni =
      MUNICIPALITIES_BY_PROVINCE[detectedProv]?.find(
        (m) => normalizeLocationText(m) === normMuni
      ) || newMunicipality;

    return {
      provincia: detectedProv,
      municipio: canonicalMuni,
    };
  }

  return {
    provincia: currentProv,
    municipio: newMunicipality,
  };
}
