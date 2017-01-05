/// <reference path="D:\OnTerra\DCProperties\DCProperties2\DCProperties2\Index.html" />
var app = {
    me: null,
    map: null,
    infobox: null,
    layers: {
        properties: null,
        streets: null,
        alleys: null,
        zones: null,
        interiors: null
    },
    showlayers: {
        properties: true,
        streets: true,
        alleys: false,
        zones: false,
        interiors: false
    },
    mapControl: null,
    dashboard: null,
    initialCenter: null,
    initialZoom: null,
    maxZoom: 16,


    getMapView: function () {
        return {
            center: map.getCenter(),
            zoom: map.getZoom()
        };
    },

    setMapView: function (view) {
        if (view) {
            map.setView(view);
        }
    },

    propertyClick: function (e) {
        var dcocto_url = 'https://oblique.sanborn.com/dcocto/?ll=' + e.location.latitude + ',' + e.location.longitude;
        $('#dcocto_frame').attr('src', dcocto_url);

        app.infobox.setOptions({
            location: e.location,
            visible: true,
            title: ' SSL:' + e.primitive.data.SSL,
            description: 'Address:' + e.primitive.data.PREMISEADD + ' Owner:' + e.primitive.data.OWNERNAME + ' Area:' + (e.primitive.data["SHAPE.AREA"] * 10.7639104).toFixed(2) + ' sf'
        });
    },


    streetClick: function (e) {
        app.infobox.setOptions({
            location: e.location,
            visible: true,
            title: e.primitive.data.ST_NAME,
            description: 'Class:' + e.primitive.data.FUNCTIONALCLASS + ' Code:' + e.primitive.data.STCODE + '  ' + e.primitive.data.DIRECTIONALITY
        });
    },

    alleyClick: function (e) {
        app.infobox.setOptions({
            location: e.location,
            visible: true,
            title: e.primitive.data.ROADTYPE,
            description: 'Directionality:' + e.primitive.data.DIRECTIONALITY
        });
    },

    zoneClick: function (e) {
        app.infobox.setOptions({
            location: e.location,
            visible: true,
            title: e.primitive.data.Zoning,
            description: "<a href='" + e.primitive.data.Zoning_Web_URL + "' target='_blank'>Zoning Description</a>"
        });
    },

    renderProperty: function (json) {
        app.layers.properties.clear();
        if (json.features.length == 1000) {
            alert("Warning:  The maximum number of properties from DC services is 1000. Zoom to smaller extent to guarantee all properties are shown.")
        }
        _.each(json.features, function (property) {
            _.each(property.geometry.rings, function (ring) {
                var coordinates = [];
                _.each(ring, function (coord) {
                    coordinates.push(new Microsoft.Maps.Location(coord[1], coord[0]));
                });
                var p = new Microsoft.Maps.Polygon(coordinates);
                p.data = property.attributes;
                Microsoft.Maps.Events.addHandler(p, 'click', app.propertyClick);
                app.layers.properties.add(p);
            });
        });

        if (app.showlayers.streets && app.showlayers.properties && app.showlayers.interiors) {
            app.findInteriors();
        }
    },

    renderStreet: function (json) {
        app.layers.streets.clear();

        _.each(json.features, function (street) {
            _.each(street.geometry.paths, function (path) {
                var coordinates = [];
                _.each(path, function (coord) {
                    coordinates.push(new Microsoft.Maps.Location(coord[1], coord[0]));
                });
                var p = new Microsoft.Maps.Polyline(coordinates, { strokeThickness: 4 });
                p.data = street.attributes;
                Microsoft.Maps.Events.addHandler(p, 'click', app.streetClick);
                app.layers.streets.add(p);
            });
        });
    },

    renderAlleys: function (json) {
        app.layers.alleys.clear();

        _.each(json.features, function (alley) {
            _.each(alley.geometry.paths, function (path) {
                var coordinates = [];
                _.each(path, function (coord) {
                    coordinates.push(new Microsoft.Maps.Location(coord[1], coord[0]));
                });
                var p = new Microsoft.Maps.Polyline(coordinates, { strokeThickness: 3, strokeColor: "red" });
                p.data = alley.attributes;
                Microsoft.Maps.Events.addHandler(p, 'click', app.alleyClick);
                app.layers.alleys.add(p);
            });
        });
    },

    renderZones: function (json) {
        app.layers.zones.clear();

        _.each(json.features, function (zone) {
            _.each(zone.geometry.rings, function (ring) {
                var coordinates = [];
                _.each(ring, function (coord) {
                    coordinates.push(new Microsoft.Maps.Location(coord[1], coord[0]));
                });
                var color = new Microsoft.Maps.Color(100, 255, 255, 0);
                if (_.includes(zone.attributes.Zoning, 'PDR')) color = new Microsoft.Maps.Color(100, 255, 0, 0);
                else if (_.includes(zone.attributes.Zoning, 'MU')) color = new Microsoft.Maps.Color(100, 255, 128, 0);
                else if (_.includes(zone.attributes.Zoning, 'RA')) color = new Microsoft.Maps.Color(100, 102, 102, 0);
                else if (_.includes(zone.attributes.Zoning, 'RF')) color = new Microsoft.Maps.Color(100, 80, 80, 0);
                else if (_.includes(zone.attributes.Zoning, 'R')) color = new Microsoft.Maps.Color(100, 255, 255, 0);
                else if (_.includes(zone.attributes.Zoning, 'SP')) color = new Microsoft.Maps.Color(100, 0, 0, 255);
                else color = new Microsoft.Maps.Color(100, 102, 0, 102);
                var p = new Microsoft.Maps.Polygon(coordinates, { fillColor: color });
                p.data = zone.attributes;
                Microsoft.Maps.Events.addHandler(p, 'click', app.zoneClick);
                app.layers.zones.add(p);
            });
        });
    },

    findInteriors: function () {
        var maxDist = 15000;
        var allproperties = app.layers.properties.getPrimitives();
        var allstreets = app.layers.streets.getPrimitives();
        var interiorProperties = [];
        _.each(allproperties, function (property) {
            var distance = Microsoft.Maps.SpatialMath.Geometry.distance(property, allstreets, Microsoft.Maps.SpatialMath.DistanceUnits.Feet, true);
            var area = Microsoft.Maps.SpatialMath.Geometry.area(property, Microsoft.Maps.SpatialMath.AreaUnits.SquareFeet);
            if (distance > 100 && distance < 1000 && area > 450) {
                interiorProperties.push(property);
            }
        });

        app.layers.interiors.clear();

        _.each(interiorProperties, function (property) {
            property.setOptions({ fillColor: new Microsoft.Maps.Color(200, 255, 0, 0) });
            app.layers.interiors.add(property);
        });
    },


    getLayers: function () {
        if (app.map.getZoom() > app.maxZoom) {
            if (app.showlayers.streets) {
                var bds = app.map.getBounds();
                bds.buffer(1.5);
                var urlStreet = 'https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Transportation_WebMercator/MapServer/41/query?f=json&returnGeometry=true&spatialRel=esriSpatialRelIntersects&maxAllowableOffset=0&geometry=' + bds.getWest() + ',' + bds.getSouth() + ',' + bds.getEast() + ',' + bds.getNorth() + '&geometryType=esriGeometryEnvelope&inSR=4326&outFields=*&outSR=4326&callback=';
                $.getJSON(urlStreet, function (json) {
                    app.renderStreet(json);
                });
            }
            if (app.showlayers.alleys) {
                var bds = app.map.getBounds();
                var urlAlley = 'https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Transportation_WebMercator/MapServer/40/query?f=json&returnGeometry=true&spatialRel=esriSpatialRelIntersects&maxAllowableOffset=0&geometry=' + bds.getWest() + ',' + bds.getSouth() + ',' + bds.getEast() + ',' + bds.getNorth() + '&geometryType=esriGeometryEnvelope&inSR=4326&outFields=*&outSR=4326&callback=';
                $.getJSON(urlAlley, function (json) {
                    app.renderAlleys(json);
                });
            }
            if (app.showlayers.properties) {
                var bds = app.map.getBounds();
                var urlProperty = 'http://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_APPS/Real_Property_Application/MapServer/3/query?f=json&returnGeometry=true&spatialRel=esriSpatialRelIntersects&maxAllowableOffset=0&geometry=' + bds.getWest() + ',' + bds.getSouth() + ',' + bds.getEast() + ',' + bds.getNorth() + '&geometryType=esriGeometryEnvelope&inSR=4326&outFields=*&outSR=4326&callback=';
                $.getJSON(urlProperty, function (json) {
                    app.renderProperty(json);
                });
            }
            if (app.showlayers.zones) {
                var bds = app.map.getBounds();
                var urlZones = 'https://maps2.dcgis.dc.gov/dcgis/rest/services/DCOZ/Zoning_MapServices/MapServer/9/query?f=json&returnGeometry=true&spatialRel=esriSpatialRelIntersects&maxAllowableOffset=0&geometry=' + bds.getWest() + ',' + bds.getSouth() + ',' + bds.getEast() + ',' + bds.getNorth() + '&geometryType=esriGeometryEnvelope&inSR=4326&outFields=*&outSR=4326&callback=';
                $.getJSON(urlZones, function (json) {
                    app.renderZones(json);
                });
            }

        }
    },

    // Create the map when overlays style have been loaded
    getMap: function () {
        Microsoft.Maps.loadModule('Microsoft.Maps.SpatialMath');

        app.initialCenter = new Microsoft.Maps.Location(38.89892, -76.9883);
        app.initialZoom = 18;
        var mapEl = document.getElementById("map"),
            mapOptions = {
                customizeOverlays: true,
                zoom: app.initialZoom,
                credentials: 'AgVbv4_LoL50EjGI4E9b3wyOfFpVQ0bJArf4mQujJH5j5OXHGpbm-EDFclTOBb4p',
                mapTypeId: Microsoft.Maps.MapTypeId.road,
                showBreadcrumb: false,
                showDashboard: true,
                showMapTypeSelector: true,
                enableClickableLogo: false,
                enableSearchLogo: false,
                center: app.initialCenter
            };

        var dcocto_url = 'https://oblique.sanborn.com/dcocto/?ll=' + app.initialCenter.latitude + ',' + app.initialCenter.longitude;
        $('#dcocto_frame').attr('src', dcocto_url);

        try {
            app.map = new Microsoft.Maps.Map(mapEl, mapOptions);
            // NOTE: app.layers with drawings in them steal all click events
            // so we put them at the bottom
            app.layers = {
                properties: new Microsoft.Maps.Layer({ zIndex: 500 }),
                streets: new Microsoft.Maps.Layer({ zIndex: 600 }),
                alleys: new Microsoft.Maps.Layer({ zIndex: 700 }),
                zones: new Microsoft.Maps.Layer({ zIndex: 800 }),
                interiors: new Microsoft.Maps.Layer({ zIndex: 900 })
            };
            app.showlayers = {
                properties: true,
                streets: true,
                alleys: false,
                zones: false,
                interiors: false
            }
            _.each(app.layers, function (layer) {
                app.map.layers.insert(layer);
            });

            app.getLayers();

            //viewchangeend handler
            Microsoft.Maps.Events.addHandler(app.map, 'viewchangeend', app.getLayers);

            app.infobox = new Microsoft.Maps.Infobox(app.map.getCenter(), {
                title: 'Title',
                description: 'Description',
                visible: false
            });
            app.infobox.setMap(app.map);

            // override bootstrap event to work with all Chrome and Safari browsers
            $('#caret_layerlist').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                $('#layerList').toggle();
            });
            $('#button_layerlist').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                $('#layerList').toggle();
            });

            $('#layerList li').on('click', function (e) {

                var command = $(e.target).closest('[data-command]').data('command');
                switch (command) {
                    case 'showProperties': {
                        if (app.showlayers.properties) $('#layer_properties').removeClass("fa-check-square-o").addClass("fa-square-o");
                        else $('#layer_properties').removeClass("fa-square-o").addClass("fa-check-square-o");
                        app.showlayers.properties = app.showlayers.properties ? false : true;
                        app.layers.properties.setVisible(app.showlayers.properties);
                        break;
                    }

                    case 'showStreets': {
                        if (app.showlayers.streets) $('#layer_streets').removeClass("fa-check-square-o").addClass("fa-square-o");
                        else $('#layer_streets').removeClass("fa-square-o").addClass("fa-check-square-o");
                        app.showlayers.streets = app.showlayers.streets ? false : true;
                        app.layers.streets.setVisible(app.showlayers.streets);
                        break;
                    }
                    case 'showAlleys': {
                        if (app.showlayers.alleys) $('#layer_alleys').removeClass("fa-check-square-o").addClass("fa-square-o");
                        else $('#layer_alleys').removeClass("fa-square-o").addClass("fa-check-square-o");
                        app.showlayers.alleys = app.showlayers.alleys ? false : true;
                        app.layers.alleys.setVisible(app.showlayers.alleys);
                        break;
                    }
                    case 'showZones': {
                        if (app.showlayers.zones) $('#layer_zones').removeClass("fa-check-square-o").addClass("fa-square-o");
                        else $('#layer_zones').removeClass("fa-square-o").addClass("fa-check-square-o");
                        app.showlayers.zones = app.showlayers.zones ? false : true;
                        app.layers.zones.setVisible(app.showlayers.zones);
                        break;
                    }
                    case 'showInteriors': {
                        if (app.showlayers.properties && app.showlayers.streets ) {
                            if (app.showlayers.interiors) $('#layer_interiors').removeClass("fa-check-square-o").addClass("fa-square-o");
                            else $('#layer_interiors').removeClass("fa-square-o").addClass("fa-check-square-o");
                            app.showlayers.interiors = app.showlayers.interiors ? false : true;
                            app.layers.interiors.setVisible(app.showlayers.interiors);
                        }
                        else {
                            alert('Interior calculation requires properties and streets');
                        }
                        break;
                    }
                }
                app.getLayers();
                $('#layerList').hide();
            });

        }
        catch (err) {
            alert('Error:' + err.message);
        }
    },

    initialize: function () {
        app.getMap();
        app.dashboard = new app.Dashboard();

        // set up loading indicator
        $(document).ajaxStart(function () { $('#loading').removeClass('hide'); });
        $(document).ajaxStop(function () { $('#loading').addClass('hide'); });

    }
}
