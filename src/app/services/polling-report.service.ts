import { Injectable } from '@angular/core';
import { PollingService } from './polling.service';
import { NotesService } from './notes.service';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class PollingReportService {
  constructor(private pollingService: PollingService, private notesService: NotesService) {}

  getClosedPollingReport(pollingOrderId: number, accessToken: string, isOrderClerk: boolean, filterNullNotes: boolean = true): Observable<any> {
    return this.pollingService.getPollingReport(pollingOrderId, accessToken).pipe(
      switchMap((pollingReport: any) => {
        if (!pollingReport || !pollingReport[0] || !pollingReport[0].polling_id) {
          return of(null);
        }
        const pollingId = pollingReport[0].polling_id;
        return forkJoin({
          notes: this.notesService.getAllPollingNotesById(pollingId, accessToken),
          totals: this.notesService.getPollingReportTotals(pollingId, accessToken)
        }).pipe(
          map(({ notes, totals }) => {
            // Build the report object as in reportBuilder
            const pollingTitle = pollingReport[0].polling_name;
            const pollingOrderPollingType = pollingReport[0].polling_order_polling_type;
            const pollingOrderParticipation = pollingReport[0].polling_order_polling_participation;
            const pollingOrderScore = pollingReport[0].polling_order_polling_score;
            const endDate = pollingReport[0].end_date.split('T')[0];
            const startDate = pollingReport[0].start_date.split('T')[0];
            const activeMembers = pollingReport[1].active_members;
            const participatingMembers = pollingReport[2].member_participation;
            const participationRate = ((participatingMembers / activeMembers) * 100).toFixed(2);
            const certified = ((participatingMembers / activeMembers) * 100) >= pollingOrderParticipation ? 'certified.' : 'not certified.';
            let candidateList = [...new Map((totals as any[]).map((item: any) => [item['name'], item])).values()] as any[];
            let ticker = 0;
            let positive = 0;
            let negative = 0;
            let abstain = 0;
            let candidateNumber = 0;
            let recommended = '';
            candidateList = (candidateList as any[]).sort((a, b) => (b.name as string).localeCompare(a.name));
            candidateList.forEach((x: any) => {
              positive = 0;
              negative = 0;
              abstain = 0;
              ticker = 0;
              totals.forEach((element) => {
                recommended = '';
                if ((x.name as string) === (element.name as string)) {
                  if (element.vote === 'Yes') positive += parseInt(element.total);
                  if (element.vote === 'No') negative += parseInt(element.total);
                  if (element.vote === 'Wait') negative += parseInt(element.total);
                  if (element.vote === 'Abstain' || element.vote === 'Null') abstain += parseInt(element.total);
                }
                if (totals.length - 1 === ticker) {
                  let rating = parseFloat(((positive) / (participatingMembers - abstain) * 100).toFixed(2));
                  if (rating < 0 || isNaN(rating)) rating = 0;
                  if (pollingOrderScore > 0) {
                    if (rating >= pollingOrderScore) {
                      recommended = 'has been recommended to join the order with a rating of ' + rating + '%';
                    } else {
                      recommended = 'has NOT been recommended to join the order with a rating of ' + rating + '%';
                    }
                  }
                  (candidateList[candidateNumber] as any).rating = rating;
                  (candidateList[candidateNumber] as any).recommended = recommended;
                  (candidateList[candidateNumber] as any).inProcessRating = rating + '%';
                } else {
                  ticker++;
                }
              });
              if (isOrderClerk) {
                (candidateList[candidateNumber] as any).notes = (notes as any[])?.filter((e: any) => {
                  const match = e.candidate_id === (candidateList[candidateNumber] as any).candidate_id;
                  return filterNullNotes ? (match && e.note !== null) : match;
                });
              } else {
                (candidateList[candidateNumber] as any).notes = (notes as any[])?.filter((e: any) => {
                  const match = e.candidate_id === (candidateList[candidateNumber] as any).candidate_id && e.private === false;
                  return filterNullNotes ? (match && e.note !== null) : match;
                });
              }
              candidateNumber++;
            });
            (candidateList as any[]).sort((a, b) => (b.rating as number) - (a.rating as number));
            return {
              pollingOrderName: pollingReport[0].polling_order_name,
              pollingTitle,
              startDate,
              endDate,
              pollingOrderPollingType,
              pollingOrderParticipation,
              participatingMembers,
              activeMembers,
              participationRate,
              certified,
              pollingOrderScore,
              candidateList,
              pollingTotal: totals
            };
          }),
          catchError(() => of(null))
        );
      }),
      catchError(() => of(null))
    );
  }

  getSpecificPollingReport(pollingId: number, pollingOrderId: number, accessToken: string, isOrderClerk: boolean, filterNullNotes: boolean = true): Observable<any> {
    return forkJoin({
      polling: this.pollingService.getPolling(pollingId, accessToken),
      notes: this.notesService.getAllPollingNotesById(pollingId, accessToken),
      totals: this.notesService.getPollingReportTotals(pollingId, accessToken)
    }).pipe(
      switchMap(({ polling, notes, totals }) => {
        if (!polling) {
          return of(null);
        }
        
        // Get polling order details
        return this.pollingService.getPollingReport(pollingOrderId, accessToken).pipe(
          map((pollingReport: any) => {
            if (!pollingReport || !pollingReport[0]) {
              return null;
            }
            
            const pollingTitle = polling.polling_name;
            const pollingOrderPollingType = pollingReport[0].polling_order_polling_type;
            const pollingOrderParticipation = pollingReport[0].polling_order_polling_participation;
            const pollingOrderScore = pollingReport[0].polling_order_polling_score;
            const endDate = polling.end_date.split('T')[0];
            const startDate = polling.start_date.split('T')[0];
            const activeMembers = pollingReport[1].active_members;
            const participatingMembers = pollingReport[2].member_participation;
            const participationRate = ((participatingMembers / activeMembers) * 100).toFixed(2);
            const certified = ((participatingMembers / activeMembers) * 100) >= pollingOrderParticipation ? 'certified.' : 'not certified.';
            
            let candidateList = [...new Map((totals as any[]).map((item: any) => [item['name'], item])).values()] as any[];
            let ticker = 0;
            let positive = 0;
            let negative = 0;
            let abstain = 0;
            let candidateNumber = 0;
            let recommended = '';
            
            candidateList = (candidateList as any[]).sort((a, b) => (b.name as string).localeCompare(a.name));
            candidateList.forEach((x: any) => {
              positive = 0;
              negative = 0;
              abstain = 0;
              ticker = 0;
              totals.forEach((element) => {
                recommended = '';
                if ((x.name as string) === (element.name as string)) {
                  if (element.vote === 'Yes') positive += parseInt(element.total);
                  if (element.vote === 'No') negative += parseInt(element.total);
                  if (element.vote === 'Wait') negative += parseInt(element.total);
                  if (element.vote === 'Abstain' || element.vote === 'Null') abstain += parseInt(element.total);
                }
                if (totals.length - 1 === ticker) {
                  let rating = parseFloat(((positive) / (participatingMembers - abstain) * 100).toFixed(2));
                  if (rating < 0 || isNaN(rating)) rating = 0;
                  if (pollingOrderScore > 0) {
                    if (rating >= pollingOrderScore) {
                      recommended = 'has been recommended to join the order with a rating of ' + rating + '%';
                    } else {
                      recommended = 'has NOT been recommended to join the order with a rating of ' + rating + '%';
                    }
                  }
                  (candidateList[candidateNumber] as any).rating = rating;
                  (candidateList[candidateNumber] as any).recommended = recommended;
                  (candidateList[candidateNumber] as any).inProcessRating = rating + '%';
                } else {
                  ticker++;
                }
              });
              if (isOrderClerk) {
                (candidateList[candidateNumber] as any).notes = (notes as any[])?.filter((e: any) => {
                  const match = e.candidate_id === (candidateList[candidateNumber] as any).candidate_id;
                  return filterNullNotes ? (match && e.note !== null) : match;
                });
              } else {
                (candidateList[candidateNumber] as any).notes = (notes as any[])?.filter((e: any) => {
                  const match = e.candidate_id === (candidateList[candidateNumber] as any).candidate_id && e.private === false;
                  return filterNullNotes ? (match && e.note !== null) : match;
                });
              }
              candidateNumber++;
            });
            (candidateList as any[]).sort((a, b) => (b.rating as number) - (a.rating as number));
            
            return {
              pollingOrderName: pollingReport[0].polling_order_name,
              pollingTitle,
              startDate,
              endDate,
              pollingOrderPollingType,
              pollingOrderParticipation,
              participatingMembers,
              activeMembers,
              participationRate,
              certified,
              pollingOrderScore,
              candidateList,
              pollingTotal: totals
            };
          }),
          catchError(() => of(null))
        );
      }),
      catchError(() => of(null))
    );
  }
} 