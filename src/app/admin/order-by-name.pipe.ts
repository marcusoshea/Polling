import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderByName'
})
export class OrderByNamePipe implements PipeTransform {
  transform(array: any[]): any[] {
    if (!Array.isArray(array)) return array;
    return array.slice().sort((a, b) => {
      const nameA = (a.polling_name || '').toLowerCase();
      const nameB = (b.polling_name || '').toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
  }
} 