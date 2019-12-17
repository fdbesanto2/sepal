const {switchMap, tap, finalize} = require('rxjs/operators')
const _ = require('lodash')
const log = require('@sepal/log')('job')
const {initWorker$} = require('./factory')

const submit$ = ({jobName, jobPath, args, args$}) =>
    initWorker$(jobName, jobPath).pipe(
        tap(() => log.trace(`Submitting job [${jobName}] to single worker`)),
        switchMap(({submit$, dispose}) =>
            submit$(args, args$).pipe(
                finalize(() => dispose())
            )
        )
    )

module.exports = {
    submit$
}