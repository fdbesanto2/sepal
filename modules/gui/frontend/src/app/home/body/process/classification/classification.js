import {recipe} from 'app/home/body/process/recipeContext'
import {sepalMap} from 'app/home/map/map'
import MapToolbar from 'app/home/map/mapToolbar'
import {setRecipeGeometryLayer} from 'app/home/map/recipeGeometryLayer'
import {compose} from 'compose'
import React from 'react'
import {selectFrom} from 'stateUtils'
import {connect} from 'store'
import {msg} from 'translate'
import ClassificationPreview from './classificationPreview'
import {defaultModel} from './classificationRecipe'
import ClassificationToolbar from './classificationToolbar'

const mapStateToProps = state => ({
    tabCount: state.process.tabs.length
})

const mapRecipeToProps = recipe => ({
    recipeId: selectFrom(recipe, 'id'),
    initialized: selectFrom(recipe, 'ui.initialized'),
    images: selectFrom(recipe, 'model.inputImagery.images')
})

class _Classification extends React.Component {
    render() {
        const {recipeId, recipePath, initialized} = this.props
        return (
            <React.Fragment>
                <MapToolbar
                    statePath={recipePath + '.ui'}
                    mapContext={recipeId}
                    labelLayerIndex={2}/>
                <ClassificationToolbar/>

                {initialized
                    ? <ClassificationPreview/>
                    : null}
            </React.Fragment>
        )
    }

    componentDidMount() {
        this.setAoiLayer()
    }

    componentDidUpdate() {
        this.setAoiLayer()
    }

    setAoiLayer() {
        const {recipeId, images, componentWillUnmount$} = this.props
        setRecipeGeometryLayer({
            contextId: recipeId,
            layerSpec: {id: 'aoi', layerIndex: 0, recipe: images && images.length > 0 ? images[0] : null},
            destroy$: componentWillUnmount$,
            onInitialized: () => {
                if (this.props.tabCount === 1) {
                    sepalMap.setContext(recipeId)
                    sepalMap.getContext(recipeId).fitLayer('aoi')
                }
            }
        })
    }
}

const Classification = compose(
    _Classification,
    connect(mapStateToProps),
    recipe({defaultModel, mapRecipeToProps})
)

export default () => ({
    id: 'CLASSIFICATION',
    labels: {
        name: msg('process.classification.create'),
        creationDescription: msg('process.classification.description'),
        tabPlaceholder: msg('process.classification.tabPlaceholder'),
    },
    components: {
        recipe: Classification
    }
})
