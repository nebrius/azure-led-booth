/*
Copyright (c) 2016 Bryan Hughes <bryan@nebri.us>

This file is part of Raver Lights.

Raver Lights is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Raver Lights is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Raver Lights.  If not, see <http://www.gnu.org/licenses/>.
*/

#include <stdint.h>

uint8_t sin8(uint8_t value) {
  return 0;
}

uint8_t calculatePixelValue(uint8_t a, uint8_t w_t, uint8_t w_x, uint8_t phi, uint8_t b, uint32_t t, uint8_t x) {
  return sin8(w_t * t / 100 + w_x * x + phi) * a / 255 + b;
}
