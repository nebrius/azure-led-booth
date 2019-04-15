EESchema Schematic File Version 4
LIBS:splitter-cache
EELAYER 29 0
EELAYER END
$Descr A4 11693 8268
encoding utf-8
Sheet 1 1
Title ""
Date ""
Rev ""
Comp ""
Comment1 ""
Comment2 ""
Comment3 ""
Comment4 ""
$EndDescr
$Comp
L Connector:Conn_01x03_Male J1
U 1 1 5CAFD647
P 4050 3950
F 0 "J1" V 4112 4094 50  0000 L CNN
F 1 "Conn_01x03_Male" V 3900 3600 50  0000 L CNN
F 2 "Connector_JST:JST_XH_B3B-XH-A_1x03_P2.50mm_Vertical" H 4050 3950 50  0001 C CNN
F 3 "~" H 4050 3950 50  0001 C CNN
	1    4050 3950
	0    1    1    0
$EndComp
$Comp
L Connector:Conn_01x03_Male J2
U 1 1 5CAFDAB9
P 4550 3950
F 0 "J2" V 4612 4094 50  0000 L CNN
F 1 "Conn_01x03_Male" V 4250 3650 50  0000 L CNN
F 2 "Connector_JST:JST_XH_B3B-XH-A_1x03_P2.50mm_Vertical" H 4550 3950 50  0001 C CNN
F 3 "~" H 4550 3950 50  0001 C CNN
	1    4550 3950
	0    1    1    0
$EndComp
$Comp
L Connector:Conn_01x03_Male J4
U 1 1 5CAFDEEE
P 5050 3950
F 0 "J4" V 5112 4094 50  0000 L CNN
F 1 "Conn_01x03_Male" V 4900 3600 50  0000 L CNN
F 2 "Connector_JST:JST_XH_B3B-XH-A_1x03_P2.50mm_Vertical" H 5050 3950 50  0001 C CNN
F 3 "~" H 5050 3950 50  0001 C CNN
	1    5050 3950
	0    1    1    0
$EndComp
$Comp
L Connector:Conn_01x03_Male J5
U 1 1 5CAFE32B
P 5500 3950
F 0 "J5" V 5562 4094 50  0000 L CNN
F 1 "Conn_01x03_Male" V 5200 3750 50  0000 L CNN
F 2 "Connector_JST:JST_XH_B3B-XH-A_1x03_P2.50mm_Vertical" H 5500 3950 50  0001 C CNN
F 3 "~" H 5500 3950 50  0001 C CNN
	1    5500 3950
	0    1    1    0
$EndComp
$Comp
L Connector:Conn_01x03_Male J3
U 1 1 5CAFEBB7
P 4750 4950
F 0 "J3" V 4904 4762 50  0000 R CNN
F 1 "Conn_01x03_Male" V 4600 5250 50  0000 R CNN
F 2 "Connector_JST:JST_VH_B3PS-VH_1x03_P3.96mm_Horizontal" H 4750 4950 50  0001 C CNN
F 3 "~" H 4750 4950 50  0001 C CNN
	1    4750 4950
	0    -1   -1   0
$EndComp
Wire Wire Line
	4150 4150 4150 4450
Wire Wire Line
	4150 4450 4650 4450
Wire Wire Line
	4650 4450 4650 4750
Wire Wire Line
	4650 4150 4650 4450
Connection ~ 4650 4450
Wire Wire Line
	5150 4150 5150 4450
Wire Wire Line
	5150 4450 4650 4450
Wire Wire Line
	5600 4150 5600 4450
Wire Wire Line
	5600 4450 5150 4450
Connection ~ 5150 4450
Wire Wire Line
	5500 4150 5500 4550
Wire Wire Line
	5500 4550 5050 4550
Wire Wire Line
	4750 4550 4750 4750
Wire Wire Line
	5400 4150 5400 4650
Wire Wire Line
	5400 4650 4950 4650
Wire Wire Line
	4850 4650 4850 4750
Wire Wire Line
	5050 4150 5050 4550
Connection ~ 5050 4550
Wire Wire Line
	5050 4550 4750 4550
Wire Wire Line
	4550 4150 4550 4550
Wire Wire Line
	4550 4550 4750 4550
Connection ~ 4750 4550
Wire Wire Line
	4050 4150 4050 4550
Wire Wire Line
	4050 4550 4550 4550
Connection ~ 4550 4550
Wire Wire Line
	3950 4150 3950 4650
Connection ~ 4850 4650
Wire Wire Line
	4450 4150 4450 4650
Wire Wire Line
	3950 4650 4450 4650
Connection ~ 4450 4650
Wire Wire Line
	4450 4650 4850 4650
Wire Wire Line
	4950 4150 4950 4650
Connection ~ 4950 4650
Wire Wire Line
	4950 4650 4850 4650
$Comp
L Mechanical:MountingHole H1
U 1 1 5CB0E864
P 6600 3600
F 0 "H1" H 6700 3646 50  0000 L CNN
F 1 "MountingHole" H 6700 3555 50  0000 L CNN
F 2 "MountingHole:MountingHole_3.7mm" H 6600 3600 50  0001 C CNN
F 3 "~" H 6600 3600 50  0001 C CNN
	1    6600 3600
	1    0    0    -1
$EndComp
$Comp
L Mechanical:MountingHole H2
U 1 1 5CB0EE3A
P 6600 3850
F 0 "H2" H 6700 3896 50  0000 L CNN
F 1 "MountingHole" H 6700 3805 50  0000 L CNN
F 2 "MountingHole:MountingHole_3.7mm" H 6600 3850 50  0001 C CNN
F 3 "~" H 6600 3850 50  0001 C CNN
	1    6600 3850
	1    0    0    -1
$EndComp
$EndSCHEMATC
