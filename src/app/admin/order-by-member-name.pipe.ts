import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'orderByMemberName' })
export class OrderByMemberNamePipe implements PipeTransform {
  transform(array: any[]): any[] {
    if (!Array.isArray(array)) return array;
    return array.slice().sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }
} 