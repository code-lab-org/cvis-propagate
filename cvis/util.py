#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Constellation Visualization (CVIS) Utilities

Contains general-purpose utility functions and classes.
"""
__author__ = "Collective Design Lab"
__copyright__ = "Copyright 2019, Stevens Institute of Technology"
__credits__ = ["Paul Grogan"]
__vesion__ = "1.0.0"

from orekit.pyhelpers import absolutedate_to_datetime, datetime_to_absolutedate
from org.hipparchus.geometry.euclidean.threed import Vector3D
from org.orekit.frames import FramesFactory, Frame, TopocentricFrame
from org.orekit.bodies import OneAxisEllipsoid, GeodeticPoint
from org.orekit.time import AbsoluteDate
from org.orekit.utils import IERSConventions, Constants
import isodate
import datetime

# earth-centered, earth-fixed reference frame
ITRF = FramesFactory.getITRF(IERSConventions.IERS_2010, True)
# earth-centered, inertial reference frame
EME2000 = FramesFactory.getEME2000()
# earth body shape
EARTH = OneAxisEllipsoid(Constants.WGS84_EARTH_EQUATORIAL_RADIUS,
                         Constants.WGS84_EARTH_FLATTENING, ITRF)

def is_numeric(s):
    """ Checks if a string contains a numeric value.

    :param s: The string to check
    :type s: str
    :rtype: bool
    """
    try:
        float(s)
        return True
    except ValueError:
        return False

def geodetic_to_cartesian(point, frame, date):
    """ Transforms a geodetic point (lat/lon/alt) to a Cartesian (x/y/z) point.

    :param point: The geodetic point.
    :type point: org.orekit.bodies.GeodeticPoint
    :param frame: The Cartesian coordinate reference frame.
    :type frame: org.orekit.frames.Frame
    :param date: The date of this coordinate transformation.
    :type date: org.orekit.time.AbsoluteDate
    :rtype: org.hipparchus.geometry.euclidean.threed.Vector3D
    """
    point = (
        point if isinstance(point, GeodeticPoint)
        else GeodeticPoint(point['latitude'], point['longitude'], point['altitude'])
    )
    date = (
        date if isinstance(date, AbsoluteDate)
        else datetime_to_absolutedate(date) if isinstance(date, datetime.datetime)
        else datetime_to_absolutedate(isodate.parse_datetime(date))
    )
    transform = EARTH.getBodyFrame().getTransformTo(frame, date)
    return transform.transformPosition(EARTH.transform(point))

def cartesian_to_geodetic(point, frame, date):
    """ Transforms a Cartesian point (x/y/z) to a geodetic (lat/lon/alt) point.

    :param point: The Cartesian point.
    :type point: org.hipparchus.geometry.euclidean.threed.Vector3D
    :param frame: The Cartesian coordinate reference frame.
    :type frame: org.orekit.frames.Frame
    :param date: The date of this coordinate transformation.
    :type date: org.orekit.time.AbsoluteDate
    :rtype: org.orekit.bodies.GeodeticPoint
    """
    point = (
        point if isinstance(point, Vector3D)
        else Vector3D(point['x'], point['y'], point['z'])
    )
    date = (
        date if isinstance(date, AbsoluteDate)
        else datetime_to_absolutedate(date) if isinstance(date, datetime.datetime)
        else datetime_to_absolutedate(isodate.parse_datetime(date))
    )
    return EARTH.transform(point, frame, date)
