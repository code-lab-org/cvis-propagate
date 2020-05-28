#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Constellation Visualization (CVIS) Orbital Propagation.

This module provides orbital propagation services.
"""
__author__ = "Collective Design Lab"
__copyright__ = "Copyright 2019, Stevens Institute of Technology"
__credits__ = ["Paul Grogan"]
__vesion__ = "1.0.0"

from orekit.pyhelpers import absolutedate_to_datetime, datetime_to_absolutedate
from org.orekit.propagation.analytical.tle import TLE, TLEPropagator
from org.orekit.propagation.analytical import KeplerianPropagator, EcksteinHechlerPropagator
from org.orekit.forces.gravity.potential import GravityFieldFactory
from org.orekit.orbits import CircularOrbit, KeplerianOrbit, Orbit
from org.orekit.orbits import PositionAngle
from org.orekit.utils import Constants
from math import degrees, radians
import datetime
import pandas as pd
import numpy as np
import isodate
import json

from .util import is_numeric, EARTH, EME2000, cartesian_to_geodetic

def parse_datetime(text):
    # convert the supplied start to a python datetime, start at environment start if no start date is provided.
    if isinstance(text, datetime.datetime):
        return text
    else:
        return isodate.parse_datetime(text)

def parse_timedelta(text):
    # convert the supplied duration to a python timedelta, end at environment end if no duration is given
    if isinstance(text, datetime.timedelta):
        return text
    elif isinstance(text, str) and is_numeric(text):
        return datetime.timedelta(seconds=float(text))
    elif isinstance(text, str):
        return isodate.parse_duration(text)
    else:
        return datetime.timedelta(seconds=float(text))

def propagate(propagator, start, duration, time_step=10.0):
    start = parse_datetime(start)
    duration = parse_timedelta(duration)
    time_step = parse_timedelta(time_step)
    # helper function to extract the state values for each date
    def get_df_row(propagator, date):
        # get the new position and velocity coordinates from the propagator
        pv = propagator.getPVCoordinates(datetime_to_absolutedate(date), EME2000)
        # extract the position vector
        pos = pv.getPosition()
        # transform the position vector to a geodetic point
        geo_pos = cartesian_to_geodetic(pos, EME2000, date)
        # return the row data
        return [
            date,
            degrees(geo_pos.getLatitude()),
            degrees(geo_pos.getLongitude()),
            geo_pos.getAltitude(),
            pos.x,
            pos.y,
            pos.z
        ]
    # time series of dates to evaluate
    dates = pd.date_range(
        start = start,
        end = start + duration,
        freq = time_step
    ).tz_convert(datetime.timezone.utc)
    # build the results data frame
    df = pd.DataFrame(
        [get_df_row(propagator, date) for date in dates],
        columns=['date', 'latitude', 'longitude', 'altitude', 'x', 'y', 'z']
    )
    # return the results
    return {
        'start': isodate.datetime_isoformat(start),
        'duration': isodate.duration_isoformat(duration),
        'timeStep': isodate.duration_isoformat(time_step),
        'propagator': propagator.__class__.__name__,
        'history': json.loads(df.to_json(orient='records', date_format='iso'))
    }


def propagate_tle(tle, start, duration, time_step=10.0):
    """Propagates an orbit using two line element (TLE) data.

    Propagates an orbit forward in time based on an initial state in
    two line element format. Outputs geodetic coordinates in degrees and
    Cartesian coordinates in EME2000/J2000 Earth-centered inertial frame.

    :param tle: two line elements
    :type tle: list(str)
    :param start: starting datetime
    :type start: datetime or str (iso8601)
    :param duration: propagation duration
    :type duration: timedelta or str (iso8601) or float (seconds)
    :param time_step: time step duration
    :type time_step: timedelta or str (iso8601) or float (seconds)
    :rtype: DataFrame
    """
    # parse the two line elements using orekit function
    tle = TLE(tle[0], tle[1])
    # select the appropriate orbit extrapolator
    propagator = TLEPropagator.selectExtrapolator(tle)
    # execute propagation
    results = propagate(propagator, start, duration, time_step)
    # append case-specific inputs
    results['tle'] = [tle.getLine1(), tle.getLine2()]
    # return results
    return results

def parse_orbit(orbit, date=None):
    if isinstance(orbit, Orbit):
        return orbit
    elif (isinstance(orbit, dict)
            and (
                (orbit.get('semimajorAxis') and is_numeric(orbit.get('semimajorAxis')))
                or (orbit.get('altitude') and is_numeric(orbit.get('altitude')))
            ) and (
                orbit.get('eccentricity') is None
                or is_numeric(orbit.get('eccentricity'))
            ) and (
                orbit.get('inclination') is None
                or is_numeric(orbit.get('inclination'))
            ) and (
                orbit.get('perigeeArgument') is None
                or is_numeric(orbit.get('perigeeArgument'))
            ) and (
                orbit.get('rightAscensionOfAscendingNode') is None
                or is_numeric(orbit.get('rightAscensionOfAscendingNode'))
            ) and (
                orbit.get('trueAnomaly') is None
                or is_numeric(orbit.get('trueAnomaly'))
            )):

        return KeplerianOrbit(
            (float(orbit.get('semimajorAxis'))
            if orbit.get('semimajorAxis')
                and is_numeric(orbit.get('semimajorAxis'))
            else float(orbit.get('altitude')) + EARTH.getEquatorialRadius()),
            float(orbit.get('eccentricity', 0.0)),
            radians(float(orbit.get('inclination', 0.0))),
            radians(float(orbit.get('perigeeArgument', 0.0))),
            radians(float(orbit.get('rightAscensionOfAscendingNode', 0.0))),
            radians(float(orbit.get('trueAnomaly', 0.0))),
            PositionAngle.TRUE,
            EME2000,
            datetime_to_absolutedate(parse_datetime(orbit.get('date', date))),
            Constants.EGM96_EARTH_MU
        )
    else:
        return None

def to_json(orbit):
    return (
        {
            'semimajorAxis': orbit.getA(),
            'eccentricity': orbit.getE(),
            'inclination': degrees(orbit.getI()),
            'perigeeArgument': degrees(orbit.getPerigeeArgument()),
            'rightAscensionOfAscendingNode': degrees(orbit.getRightAscensionOfAscendingNode()),
            'trueAnomaly': degrees(orbit.getTrueAnomaly()),
            'date': isodate.datetime_isoformat(absolutedate_to_datetime(orbit.getDate()))
        } if isinstance(orbit, KeplerianOrbit)
        else {}
    )

def propagate_orbit(orbit, start, duration, time_step=10.0):
    """Propagates an orbit using various orbital elements.

    Propagates an orbit forward in time based on an initial state in
    Keplerian orbital elements. Outputs geodetic coordinates in degrees and
    Cartesian coordinates in EME2000/J2000 Earth-centered inertial frame.

    :param orbit: Keplerian elements
    :type orbit: dict
    :param start: starting datetime
    :type start: datetime or str (iso8601)
    :param duration: propagation duration
    :type duration: timedelta or str (iso8601) or float (seconds)
    :param time_step: time step duration
    :type time_step: timedelta or str (iso8601) or float (seconds)
    :rtype: DataFrame
    """
    # parse the orbit
    orekit_orbit = parse_orbit(orbit, start)
    # select the appropriate orbit propagator
    if (orekit_orbit.getE() < 0.1 and orbit.get('harmonics')):
        if(isinstance(orbit.get('harmonics'), dict)
                and orbit.get('harmonics').get('degree')
                and is_numeric(orbit.get('harmonics').get('degree'))
                and float(orbit.get('harmonics').get('degree')) >= 6):
            harmonics = GravityFieldFactory.getUnnormalizedProvider(
                orbit.get('harmonics').get('degree', 6),
                orbit.get('harmonics').get('order', 0)
            )
            propagator = EcksteinHechlerPropagator(
                orekit_orbit,
                harmonics
            )
        else:
            propagator = EcksteinHechlerPropagator(
                orekit_orbit,
                Constants.EGM96_EARTH_EQUATORIAL_RADIUS,
                Constants.EGM96_EARTH_MU,
                Constants.EGM96_EARTH_C20,
                Constants.EGM96_EARTH_C30,
                Constants.EGM96_EARTH_C40,
                Constants.EGM96_EARTH_C50,
                Constants.EGM96_EARTH_C60
            )
    else:
        propagator = KeplerianPropagator(orekit_orbit)
    # execute propagation
    results = propagate(propagator, start, duration, time_step)
    # append case-specific inputs
    results['orbit'] = to_json(orekit_orbit)
    # return results
    return results
