/// <reference path="../_references.js" />

// The following comments are for JSLint.
// Do NOT remove them!
// see http://www.jslint.com/

/*jslint browser: true, debug: true, devel: true, white: true, plusplus: true, maxerr: 100, unparam: true, nomen: true, indent: 4 */
/*global jQuery: false, app: true, _: false */

// Controls size of dashboard column.
// This is a singleton since the elements are singleton.

app.Dashboard = (function ($) {
    'use strict';
    var minWidth = 500,
        isOpen,
        width,
        left,
        right,
        dcocto,
        openButton,
        closeButton;

    function setDashboardWidth(w) {
        var num;
        // don't go below minWidth
        width = Math.max(w, minWidth);
        left.css({ display: 'block', width: width });
        right.css({ 'margin-left': width });
        dcocto.css({ width: width });
    }
    
    function openDashboard() {
        setDashboardWidth(width);
        openButton.hide();
        closeButton.show();
        isOpen = true;
        return false;
    }

    function closeDashboard() {
        left.css({ display: 'none' });
        right.css({ 'margin-left': 0 });
        openButton.show();
        closeButton.hide();
        isOpen = false;
        return false;
    }

    function Ctor() {
        left = $('#left');
        right = $('#right');
        dcocto = $('#dcocto_content');
        openButton = $('#dashboard-open').click(openDashboard);
        closeButton = $('#dashboard-close').click(closeDashboard);

        $('#dashboard-adjust').mousedown(function (e) {
            var start = e.pageX;
            var mover = function (me) {
                setDashboardWidth(me.pageX - 25);
                return false;
            };
            $('body').mousemove(mover)
            .mouseup(function (mu) {
                $(this).unbind('mousemove', mover);
                return false;
            });
            return false;
        });
        this.setSettings();

    }

    Ctor.prototype.setSettings = function (settings) {
        settings = settings || {};
        _.defaults(settings, { width: 500, isOpen: true });
        if (settings.isOpen) {
            openDashboard(settings.width);
        } else {
            closeDashboard();
        }
        setDashboardWidth(settings.width);
    };

    Ctor.prototype.getSettings = function () {
        return {
            isOpen: isOpen,
            width: width
        };
    };

    return Ctor;
}(jQuery));
