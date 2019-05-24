/*
MIT License

Copyright (c) Bryan Hughes <bryan@nebri.us>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

#include <stdint.h>

// This code borrowed from FastLED: https://github.com/FastLED/FastLED/blob/a5e92af/lib8tion/trig8.h#L210-L244
// FastLED is licensed under the MIT license, which you can read in full on their GItHub repo
// at https://github.com/FastLED/FastLED/blob/master/LICENSE
const uint8_t b_m16_interleave[] = { 0, 49, 49, 41, 90, 27, 117, 10 };
uint8_t sin8( uint8_t theta)
{
    uint8_t offset = theta;
    if( theta & 0x40 ) {
        offset = (uint8_t)255 - offset;
    }
    offset &= 0x3F; // 0..63

    uint8_t secoffset  = offset & 0x0F; // 0..15
    if( theta & 0x40) secoffset++;

    uint8_t section = offset >> 4; // 0..3
    uint8_t s2 = section * 2;
    const uint8_t* p = b_m16_interleave;
    p += s2;
    uint8_t b   =  *p;
    p++;
    uint8_t m16 =  *p;

    uint8_t mx = (m16 * secoffset) >> 4;

    int8_t y = mx + b;
    if( theta & 0x80 ) y = -y;

    y += 128;

    return y;
}
// End FastLED code

// This code was written by me, and is part of Raver Lights, which you can find at
// https://github.com/nebrius/raver-lights/blob/5664a74/hub/src/lights.cpp#L45-L47.
// Raver Lights is licensed under the GPL v3 license, which you can read at
// https://github.com/nebrius/raver-lights/blob/master/COPYING
uint8_t calculatePixelValue(uint8_t a, uint8_t w_t, uint8_t w_x, uint8_t phi, uint8_t b, uint32_t t, uint8_t x) {
  return sin8(w_t * t / 100 + w_x * x + phi) * a / 255 + b;
}
// End Raver Lights code
