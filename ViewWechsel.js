//
// Seitenwechsel-Script
// Autor: Peoples
//
//
// Funktionen:  1. Bei Viewwechsel wird geprüft ob eine andere View als Home gewählt ist
//                 wenn das der Fall ist wird ein Timer gesetzt nach dessen Ablauf wieder zurück
//                 auf Home gewechselt wird.
//              2. Wenn die Alarmanlage eingeschalten ist wird die PinEingabeView angezeigt.
//              3. Bei SystemView läuft kein Timer
//
//
// v2.0.0 - 30.09.2018  Neue Version - Grundaufbau geändert
// v2.0.1 - 09.03.2019  Slideshow aller gewünschen Views integriert
// v2.0.2 - 23.03.2019  Zusatzfunktion zum steuern der Sonderdatenpunkte eingebaut
// v2.0.3 - 28.03.2019  Zahlenwerte durch parseInt konvertiert
// v2.0.4 - 21.05.2019  Fehlerkorrekturen
// v2.0.5 - 14.09.2019  AutoViewWechsel als Screensaver möglich
// *******************************************************************************************************
// -----------------------------------------------------------------------------
// allgemeine Variablen
// -----------------------------------------------------------------------------
var logging = false;                                        // Logging on/off
var instanz = 'javascript.0';   instanz = instanz + '.';    // 
var pfad0 =   'System.Iobroker';      pfad0 = pfad0 + '.';  // Pfad innerhalb der Instanz 
var timerTout;
var timerAutoSV;
var DefaultView = 'Home';                                   // Standard-View

// Aus Datenpunkt vis.0.control.data entnehmen 
// der Teil vor dem Slash ist der Projektname:
// "Wandtablet/Home"
var project = "Wandtablet";     project = project + '/';    // Name des Vis-Projekts
 
var DisplayTime = '25';                                     // Darstellungszeit der Views bei Autowechsel
var startView = 1;                                          // Startview bei Autowechsel
var screenSv_time = 20;                                     // Zeit nach der der ScreenSaver Seitenwechsel angeht in Minuten
 
//Alle vorhandenen Views
var VisViews = [
    
        /* View Name */                  /* Anzeigezeit */   /* In Slideshow anzeigen? */

    {'view':'Alarmanlage_code',             'SWSec':180,            'ShowIAV':'no'},
    {'view':'Backup_Konfiguration',         'SWSec':180,            'ShowIAV':'no'},
    {'view':'Batterie',                     'SWSec':180,            'ShowIAV':'yes'},
    {'view':'Fenster',                      'SWSec':180,            'ShowIAV':'yes'},
    {'view':'Fritzbox',                     'SWSec':120,            'ShowIAV':'yes'},
    {'view':'Garten',                       'SWSec':60,             'ShowIAV':'yes'},
    {'view':'Heizung_Diagramme',            'SWSec':40,             'ShowIAV':'no'},
    {'view':'Heizung_EG',                   'SWSec':180,            'ShowIAV':'yes'},
    {'view':'Heizung_UG',                   'SWSec':180,            'ShowIAV':'yes'},
    {'view':'Heizung_Vitoladens300C',       'SWSec':90,             'ShowIAV':'yes'},
    {'view':'Wetter_Diagramme',             'SWSec':60,            'ShowIAV':'no'}
];
// -----------------------------------------------------------------------------
// Objekte
// -----------------------------------------------------------------------------
// Objekt für Alle Automatischen Abläufe
createState(pfad0 + 'Timer_View_Switch',  {def: '0',type: 'number',name: 'Timer für Wechsel auf DefaultView'});
createState(pfad0 + 'Auto_Switch_View',  {def: 'false',type: 'boolean',name: 'Alle Views durchlaufen lassen'});
createState(pfad0 + 'ScreenSaverAcitve',  {def: 'false',type: 'boolean',name: 'Bildschirmschoner'});
 

if(logging)log("Total "+Object.keys(VisViews).length+" entries");
 
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$

// #############################################################################
// #                                                                           #
// #  Funktion zum automatischen Viewwechsel nach Timerablauf                  #
// #                                                                           #
// #############################################################################
 
function switchToHomeView() {
        timerTout = setTimeout(function () {
            var timer = parseInt(getState(pfad0 + 'Timer_View_Switch').val, 10);
            if (timer > 1) {
                setState(pfad0 + 'Timer_View_Switch',timer - 1);
                switchToHomeView();
            }
            else{
                setState(pfad0 + 'Timer_View_Switch', 0);
                setState('vis.0.control.instance', 'FFFFFFFF'); //getState("vis.0.control.instance").val/*Control vis*/);
                setState('vis.0.control.data', project + DefaultView);
                setState('vis.0.control.command', 'changeView');
            }
        }, 1000);
}
 
// #############################################################################
// #                                                                           #
// #  Funktion zum automatisch umlaufenden Viewwechsel                         #
// #                                                                           #
// #############################################################################
 
function autoSwitchView(dspTime,i) {
        if(i === '') i = 0;
        if(logging) log(i);
        if(i < Object.keys(VisViews).length){
            if(VisViews[i].ShowIAV == 'yes'){
                timerAutoSV = setTimeout(function () {
                    var timer = parseInt(getState(pfad0 + 'Timer_View_Switch').val, 10);
                    if (timer > 1) {
                        setState(pfad0 + 'Timer_View_Switch', timer - 1);
                        autoSwitchView(dspTime, i);
                    }
                    else{
                            setState(pfad0 + 'Timer_View_Switch', 0);
                            if(getState(pfad0 + 'Auto_Switch_View').val === true) switchView(project+VisViews[i].view);
                            startAutoSwitchView(dspTime,(i+1));
                    }
                }, 1000);
            }
            else{
                startAutoSwitchView(dspTime,(i+1));
            }
        }
        else{
           startAutoSwitchView(dspTime,startView); 
        }
}
 
// #############################################################################
// #                                                                           #
// #  Funktion zum Starten und Stoppen des automatischen Viewwechsel           #
// #                                                                           #
// #############################################################################

function startAutoSwitchView(dspTime,i){
    if(getState(pfad0 + 'Auto_Switch_View').val === true){
        if(dspTime !== ''){
            setState(pfad0 + 'Timer_View_Switch',parseInt(dspTime, 10));
        }
        else{
            setState(pfad0 + 'Timer_View_Switch',15);
        }
        autoSwitchView(dspTime,i);
    } 
    else{
        if(timerTout) clearTimeout(timerTout);
        switchView(project + DefaultView);
        setStateDelayed(pfad0 + 'Timer_View_Switch',0,2000);
    }
}
//
// Beobachten des View Datenpunktes
on({id:"javascript.0.System.Iobroker.Auto_Switch_View", change: "ne"}, function (dp) {
//    if(dp.state.val === true){
        startAutoSwitchView(DisplayTime,startView);
//    }
});
 
// #############################################################################
// #                                                                           #
// #  Funktion zum Scriptbasierten Viewwechsel                                 #
// #                                                                           #
// #############################################################################
 
function switchView(view){
    setState('vis.0.control.instance', 'FFFFFFFF');
    setState('vis.0.control.data', view);
    setState('vis.0.control.command', 'changeView');
}
 
// #############################################################################
// #                                                                           #
// #  Funktion zum Prüfen der Wunsch View und zum auslesen der Darstellzeit    #
// #                                                                           #
// #############################################################################
 
function checkView(wishView){
    if(logging) log('View to check:'+wishView);
    if(getState(pfad0 + 'Auto_Switch_View').val === false ){
        for(var i = 0; i < Object.keys(VisViews).length; i++) {  
            if(project+VisViews[i].view == wishView) {
                if(logging) log('View found in:' + i);
                if(timerTout) clearTimeout(timerTout);
                setState(pfad0 + 'Timer_View_Switch', 0);
                if(VisViews[i].SWSec !== 0){
                    setState(pfad0 + 'Timer_View_Switch', VisViews[i].SWSec);
                    switchToHomeView();
                }
            }
        }
    }
}

// #############################################################################
// #                                                                           #
// #  Zusatzfunktion um ZusatzDatenpunke zu steuern                            #
// #                                                                           #
// #############################################################################

function additionalActions(dp){
    if(dp == "Wandtablet/System"){
        setState(pfad0 + "Letzte_System_Meldungen_prio", '');
    }
    if(dp == "Wandtablet/Kamera_Bilder_Haustuere"){
        setState(pfad0 + "Tuerklingel_in_Abwesenheit", false);
    }
}

// #############################################################################
// #                                                                           #
// #  ScreenSaver Funktion zum Durchschalten der Views als Bildschirmschoner   #
// #                                                                           #
// #############################################################################

function screenSaver(){
    svTimer = setTimeout(function() {
        if(getState(pfad0 + 'ScreenSaverAcitve').val === true){
            if((new Date().getTime() - getState('vis.0.control.data').lc)/60000 > screenSv_time){
                setState(pfad0 + 'Auto_Switch_View', true);
            }
            else{
                setState(pfad0 + 'Auto_Switch_View', false);
            }  
            screenSaver();  
        }
    }, 60000);
    
}
 
// Beobachten des Datenpunktes Screensaver um die Autoview einzuschalten
on({id:'javascript.0.System.Iobroker.ScreenSaverAcitve'/*Bildschirmschoner*/, change: "ne"}, function (dp) {
    if(dp.state.val === true){
        screenSaver();
        if(logging) log('Screensaver On');
    }
    else{
        if(svTimer) clearTimeout(svTimer);
        setState(pfad0 + 'Auto_Switch_View', false);
        switchView(project + DefaultView);
    } 
});
 
 
// Beobachten des View Datenpunktes für Auswertung
on({id:"vis.0.control.data", change: "ne"}, function (dp) {
    checkView(dp.state.val);
        // Zusatzfunktion um den Datenpunkt zurück zu setzten
    additionalActions(dp.state.val);
});
 
//Bei aktiver Alarmanlage auf Pin-View umschalten
on({id: "javascript.0.Alarmanlage.Status.Status"/*Status für Scharfmeldung*/, change: 'any'}, function (dp) {
    if(dp.state.val == 2 || dp.state.val == '2'){
        switchView('Alarmanlage_code');
    }
    else{
        switchView(DefaultView);
    }
});
 
//Bei Bewegung auf Kamerabild umschalten
on({id:"hm-rpc.0.XXXXXXXXXX.1.MOTION"/*Bewegungsmelder.Aussen.Haustuere.XXXXXXXXX:1.MOTION*/, change: 'any'}, function (dp) {
    if(dp.state.val === true ){
         if(getState("javascript.0.Alarmanlage.Status.Status").val != 2 || getState("javascript.0.Alarmanlage.Status.Status").val != '2'){
           switchView('Kamera_Garage');
         }
         else{
            switchView('Alarmanlage_code');
         }
    }
});
