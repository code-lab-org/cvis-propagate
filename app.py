#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Constellation Visualization (CVIS) Propagation Application.

This file contains a flask application to serve a propagation service.
"""

from flask import Flask, abort, request, jsonify
import cvis
import isodate
import os
from math import degrees
from orekit.pyhelpers import absolutedate_to_datetime
from org.orekit.propagation.analytical.tle import TLE, TLEPropagator
from org.orekit.orbits import KeplerianOrbit
from dotenv import load_dotenv
# load the .env file to configure waitress server
load_dotenv()

def create_app():
    """
    Function to create the web application.
    """
    # define flask web application
    app = Flask(__name__, static_url_path='/', static_folder='dist/')

    # route requests from the site root (/) to the index page
    @app.route('/')
    def root():
        """
        Return the site root page.
        """
        return app.send_static_file('index.html')

    # route requests from the propagate API endpoint (/propagate)
    @app.route('/propagate', methods=['POST'])
    def propagate():
        """ Propagate an orbit using TLE or Keplerian propagators. """
        if (not request.json
                or 'start' not in request.json
                or 'duration' not in request.json
                or 'timeStep' not in request.json):
            abort(400)
        cvis.vm.attachCurrentThread()
        if (request.json.get('tle')):
            if (not isinstance(request.json.get('tle'), list)
                    or len(request.json.get('tle')) != 2
                    or not isinstance(request.json.get('tle')[0], str)
                    or not isinstance(request.json.get('tle')[1], str)
                    or not TLE.isFormatOK(request.json.get('tle')[0], request.json.get('tle')[1])):
                abort(400)
            return jsonify(cvis.propagate_tle(
                tle = request.json['tle'],
                start = request.json['start'],
                duration = request.json['duration'],
                time_step = request.json['timeStep']
            )), 200
        elif (request.json.get('orbit')):
            if (not request.json.get('orbit').get('semimajorAxis')
                    and not request.json.get('orbit').get('altitude')):
                abort(400)
            return jsonify(cvis.propagate_orbit(
                orbit = request.json['orbit'],
                start = request.json['start'],
                duration = request.json['duration'],
                time_step = request.json['timeStep']
            )), 200
        else:
            abort(400)

    # route requests from the TLE to Keplerian API endpoint (/tle2kep)
    @app.route('/tle2kep', methods=['POST'])
    def convert():
        """ Convert between TLE and Kelperian orbital elements. """
        if (not request.json
                or 'tle' not in request.json
                or not isinstance(request.json.get('tle'), list)
                or len(request.json.get('tle')) != 2
                or not isinstance(request.json.get('tle')[0], str)
                or not isinstance(request.json.get('tle')[1], str)):
            abort(400)
        cvis.vm.attachCurrentThread()
        if not TLE.isFormatOK(request.json.get('tle')[0], request.json.get('tle')[1]):
            abort(400)
        tle = TLE(request.json.get('tle')[0], request.json.get('tle')[1])
        keplerian = KeplerianOrbit(TLEPropagator.selectExtrapolator(tle).getInitialState().getOrbit())
        return jsonify({
            'semimajorAxis': keplerian.getA(),
            'altitude': keplerian.getA() - cvis.EARTH.getEquatorialRadius(),
            'eccentricity': keplerian.getE(),
            'inclination': degrees(keplerian.getI()),
            'rightAscensionOfAscendingNode': degrees(keplerian.getRightAscensionOfAscendingNode()),
            'perigeeArgument': degrees(keplerian.getPerigeeArgument()),
            'trueAnomaly': degrees(keplerian.getTrueAnomaly()),
            'date': isodate.datetime_isoformat(absolutedate_to_datetime(keplerian.getDate()))
        })

    return app

if __name__ == '__main__':
    if os.environ.get('NODE_ENV') == 'production':
        from waitress import serve
        serve(
            create_app(),
            host=os.environ.get('CVIS_HOST','0.0.0.0'),
            port=os.environ.get('CVIS_PORT', 5001)
        )
    else:
        create_app().run(
            host=os.environ.get('CVIS_HOST','0.0.0.0'),
            port=os.environ.get('CVIS_PORT', 5001)
        )
