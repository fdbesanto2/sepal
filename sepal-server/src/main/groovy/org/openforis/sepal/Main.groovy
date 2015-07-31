package org.openforis.sepal

import com.amazonaws.regions.Region
import com.amazonaws.regions.Regions
import com.amazonaws.services.ec2.AmazonEC2Client
import com.amazonaws.services.ec2.model.CreateVolumeRequest
import org.openforis.sepal.command.HandlerRegistryCommandDispatcher
import org.openforis.sepal.endpoint.Endpoints
import org.openforis.sepal.geoserver.GeoServerLayerMonitor
import org.openforis.sepal.sandbox.DockerRESTClient
import org.openforis.sepal.sandbox.DockerSandboxManager
import org.openforis.sepal.sandbox.ObtainUserSandboxCommandHandler
import org.openforis.sepal.sandbox.ReleaseUserSandboxCommandHandler
import org.openforis.sepal.sandbox.SandboxManagerEndpoint
import org.openforis.sepal.scene.management.*
import org.openforis.sepal.scene.retrieval.SceneRetrievalComponent
import org.openforis.sepal.transaction.SqlConnectionManager
import org.openforis.sepal.user.JDBCUserRepository

import static com.amazonaws.services.ec2.model.VolumeType.Gp2

class Main {


    static void main(String[] args) {
        def propertiesLocation = args.length == 1 ? args[0] : "/etc/sdms/sepal.properties"
        SepalConfiguration.instance.setConfigFileLocation(propertiesLocation)

        deployEndpoints()
        startSceneManager()
        startLayerMonitor()
    }

    def static startLayerMonitor() {
        GeoServerLayerMonitor.start()
    }

    def static startSceneManager() {
        def scenesDownloadRepo = new JdbcScenesDownloadRepository(
                new SqlConnectionManager(
                        SepalConfiguration.instance.dataSource
                )
        )
        def retrievalComponent = new SceneRetrievalComponent()
        def sceneManager = new SceneManager(
                retrievalComponent.sceneProvider,
                retrievalComponent.sceneProcessor,
                retrievalComponent.scenePublisher,
                scenesDownloadRepo)

        retrievalComponent.register(scenesDownloadRepo, sceneManager)
        sceneManager.start()
    }

    def static deployEndpoints() {
        def connectionManager = new SqlConnectionManager(SepalConfiguration.instance.dataSource)
        def scenesDownloadRepo = new JdbcScenesDownloadRepository(connectionManager)
        def commandDispatcher = new HandlerRegistryCommandDispatcher(connectionManager)

        def daemonURI = SepalConfiguration.instance.dockerDaemonURI
        def imageName = SepalConfiguration.instance.dockerImageName
        def sandboxManager = new DockerSandboxManager(
                new JDBCUserRepository(connectionManager),
                new DockerRESTClient(daemonURI),
                imageName
        )

        Endpoints.deploy(
                new DataSetRepository(connectionManager),
                commandDispatcher,
                new RequestScenesDownloadCommandHandler(scenesDownloadRepo),
                new ScenesDownloadEndPoint(commandDispatcher, scenesDownloadRepo),
                scenesDownloadRepo,
                new RemoveRequestCommandHandler(scenesDownloadRepo),
                new RemoveSceneCommandHandler(scenesDownloadRepo),
                new SandboxManagerEndpoint(commandDispatcher),
                new ObtainUserSandboxCommandHandler(sandboxManager),
                new ReleaseUserSandboxCommandHandler(sandboxManager)
        )
    }

}
