const job = require('@sepal/worker/job')

const worker$ = ({recipe, bands}) => {
    const ImageFactory = require('@sepal/ee/imageFactory')
    const {getMap$} = require('@sepal/ee/utils')
    const {getImage, getVisParams} = ImageFactory(recipe, bands)
    return getMap$(getImage(), getVisParams())
}

module.exports = job({
    jobName: 'EE Image preview',
    jobPath: __filename,
    before: [require('@sepal/ee/initialize')],
    args: ctx => [ctx.request.body],
    worker$
})