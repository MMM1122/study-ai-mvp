# CPSC 213 Sample: Cache and Locality

A cache is a small, fast memory that stores copies of data from slower memory. The goal is to reduce the average time needed to access data.

Temporal locality means that if a program accessed a memory location recently, it is likely to access the same location again soon. Spatial locality means that if a program accesses one memory location, it is likely to access nearby locations soon.

Example:
```c
for (int i = 0; i < 1000; i++) {
    sum += arr[i];
}
```
The loop accesses adjacent array elements, so it has strong spatial locality.
