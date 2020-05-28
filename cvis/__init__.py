"""Constellation Visualization Tool (CVIS)
"""

__author__ = "Collective Design Lab"
__copyright__ = "Copyright 2019, Stevens Institute of Technology"
__credits__ = ["Paul Grogan"]
__vesion__ = "0.0.0"
__status__ = "Development"

import orekit
# initialize the java virtual machine
vm = orekit.initVM()

from orekit.pyhelpers import setup_orekit_curdir
from pkg_resources import resource_stream
# load the orekit physical data from resources
setup_orekit_curdir(resource_stream(__name__, 'resources/orekit-data.zip').name)

from .propagator import propagate_tle, propagate_orbit

from .util import is_numeric, EARTH, EME2000
