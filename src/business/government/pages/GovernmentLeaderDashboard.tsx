import { PageShell, PageHeader, FilterBar, SectionBlock, GridLayout } from '../../components/layout'
import { KpiCard, TrendCard, DistributionCard, RankingCard, StatusCard } from '../../components/widgets'
import { RoleIndicator } from '../../components/common'
import { governmentLeaderMock } from './mock/government-leader'

import { enterpriseBossMock } from './mock/enterprise-boss'
import { departmentManagerMock } from './mock/department-manager'
import { safetyOfficerMock } from './mock/safety-officer'
import { streetCommitteeMock } from './mock/street-committee'
import { fireStationMock } from './mock/fire-station'
import { policeOfficerMock } from './mock/police-officer'

import { courtPersonnelMock } from './mock/court-personnel'
import { hospitalAdminMock } from './mock/hospital-admin'
import { environmentalMonitorMock } from './mock/environmental-monitor'
import { communityWorkerMock } from './mock/community-worker'

import { emergencyResponseMock } from './mock/emergency-response'

import { publicRelationsMock } from './mock/public-relations'
import { logisticsCoordinatorMock } from './mock/logistics-coordinator'

import { volunteerCoordinatorMock } from './mock/volunteer-coordinator'
import { dataAnalystMock } from './mock/data-analyst'
import { policyPlannerMock } from './mock/policy-planner'
import { trainingOfficerMock } from './mock/training-officer'

import { budgetAnalystMock } from './mock/budget-analyst'
import { legalAdvisorMock } from './mock/legal-advisor'

import { publicHealthExpert } from './mock/public-health-expert'
import { urbanPlannerMock } from './mock/urban-planner'

import { socialWorkerMock } from './mock/social-worker'
import { housingManagerMock } from './mock/housing-manager'
import { transportationManagerMock } from './mock/transportation-manager'
import { parksDirectorMock } from './mock/parks-director'
import { librarianMock } from './mock/librarian'
import { teacherMock } from './mock/teacher'
import { studentAffairsMock } from './mock/student-affairs'
import { researcherMock } from './mock/researcher'
import { itDirectorMock } from './mock/it-director'
import { communicationsManagerMock } from './mock/communications-manager'
import { humanResourcesMock } from './mock/human-resources'
import { facilitiesManagerMock } from './mock/facilities-manager'
import { grantsManagerMock } from './mock/grants-manager'
import { eventCoordinatorMock } from './mock/event-coordinator'
import { interpreterMock } from './mock/interpreter'
import { securityPersonnelMock } from './mock/security-personnel'
import { maintenanceCrewMock } from './mock/maintenance-crew'
import { animalControlMock } from './mock/animal-control'
import { dispatcherMock } from './mock/dispatcher'
import { emergencyMedicalTechnicianMock } from './mock/emergency-medical-technician'

import { searchAndRescueMock } from './mock/search-and-rescue'
import { hazmatTeamMock } from './mock/hazmat-team'
import { waterQualityInspectorMock } from './mock/water-quality-inspector'
import { airQualityMonitorMock } from './mock/air-quality-monitor'
import { noiseControlOfficerMock } from './mock/noise-control-officer'
import { wasteManagementSpecialistMock } from './mock/waste-management-specialist'
import { energyAuditorMock } from './mock/energy-auditor'
import { sustainabilityCoordinatorMock } from './mock/sustainability-coordinator'
import { urbanForesterMock } from './mock/urban-forester'
import { parkRangerMock } from './mock/park-ranger'
import { marineBiologistMock } from './mock/marine-biologist'
import { meteorologistMock } from './mock/meteorologist'
import { geologistMock } from './mock/geologist'
import { archaeologistMock } from './mock/archaeologist'
import { museumCuratorMock } from './mock/museum-curator'
import { artRestorerMock } from './mock/art-restorer'
import { architectMock } from './mock/architect'
import { landscapeArchitectMock } from './mock/landscape-architect'
import { urbanDesignerMock } from './mock/urban-designer'
import { zoningOfficerMock} from './mock/zoning-officer'
import { buildingInspectorMock } from './mock/building-inspector'
import { codeEnforcementOfficerMock} from './mock/code-enforcement-officer'
import { emergencyManagerMock } from './mock/emergency-manager'
import { crisisCounselorMock} from './mock/crisis-counselor'
import { disasterReliefCoordinatorMock} from './mock/disaster-relief-coordinator'
import { homelandSecurityMock} from './mock/homeland-security'
import { cyberSecuritySpecialistMock} from './mock/cyber-security-specialist'
import { borderPatrolMock} from './mock/border-patrol'
import { coastGuardMock} from './mock/coast-guard'
import { airTrafficControllerMock} from './mock/air-traffic-controller'
import { airlinePilotMock} from './mock/airline-pilot'
import { flightAttendantMock} from './mock/flight-attendant'
import { groundCrewMock} from './mock/ground-crew'
import { shipCaptainMock} from './mock/ship-captain'
import { navalOfficerMock} from './mock/naval-officer'
import { submarineCaptainMock} from './mock/submarine-captain'
import { tankCommanderMock} from './mock/tank-commander'
import { infantryOfficerMock} from './mock/infantry-officer'
import { artilleryOfficerMock} from './mock/artillery-officer'
import { specialForcesMock} from './mock/special-forces'
import { militaryIntelligenceMock} from './mock/military-intelligence'
import { droneOperatorMock} from './mock/drone-operator'
import { spaceStationCommanderMock} from './mock/space-station-commander'
import { astronautMock} from './mock/astronaut'
import { missionControlSpecialistMock} from './mock/mission-control-specialist'
import { satelliteEngineerMock} from './mock/satellite-engineer'
import { aerospaceEngineerMock} from './mock/aerospace-engineer'
import { testPilotMock} from './mock/test-pilot'
import { aviationMechanicMock} from './mock/aviation-mechanic'
import { airfieldManagerMock} from './mock/airfield-manager'
import { customsOfficerMock} from './mock/customs-officer'
import { immigrationOfficerMock} from './mock/immigration-officer'
import { borderControlMock} from './mock/border-control'
import { translatorMock} from './mock/translator'
import { languageTeacherMock} from './mock/language-teacher'
import { culturalAttacheMock} from './mock/cultural-attache'
import { diplomatMock} from './mock/diplomat'
import { foreignServiceOfficerMock} from './mock/foreign-service-officer'
import { ambassadorMock} from './mock/ambassador'
import { unitedNationsOfficialMock} from './mock/united-nations-official'
import { worldBankOfficialMock} from './mock/world-bank-official'
import { imfRepresentativeMock} from './mock/imf-representative'
import { whoRepresentativeMock} from './mock/who-representative'
import { nGOCoordinatorMock} from './mock/n-go-coordinator'
import { humanitarianWorkerMock} from './mock/humanitarian-worker'
import { developmentWorkerMock} from './mock/development-worker'
import { peacekeeperMock} from './mock/peacekeeper'
import { electionMonitorMock} from './mock/election-monitor'
import { humanRightsAdvocateMock} from './mock/human-rights-advocate'
import { environmentalActivistMock} from './mock/environmental-activist'
import { climateScientistMock} from './mock/climate-scientist'
import { renewableEnergyExpertMock} from './mock/renewable-energy-expert'
import { solarPanelInstallerMock} from './mock/solar-panel-installer'
import { windTurbineTechnicianMock} from './mock/wind-turbine-technician'
import { electricVehicleSpecialistMock} from './mock/electric-vehicle-specialist'
import { batteryEngineerMock} from './mock/battery-engineer'
import { gridOperatorMock} from './mock/grid-operator'
import { powerPlantManagerMock} from './mock/power-plant-manager'
import { nuclearEngineerMock} from './mock/nuclear-engineer'
import { oilRigeousMock } from './mock/oil-rig-engineer'
import { gasPipelineWorkerMock} from './mock/gas-pipeline-worker'
import { refineryOperatorMock} from './mock/refinery-operator'
import { chemicalEngineerMock} from './mock/chemical-engineer'
import { processEngineerMock} from './mock/process-engineer'
import { qualityControlMock} from './mock/quality-control'
import { supplyChainManagerMock} from './mock/supply-chain-manager'
import { inventoryManagerMock} from './mock/inventory-manager'
import { warehouseManagerMock} from './mock/warehouse-manager'
import { distributionCenterManagerMock} from './mock/distribution-center-manager'
import { shippingCoordinatorMock} from './mock/shipping-coordinator'
import { truckDriverMock} from './mock/truck-driver'
import { deliveryDriverMock} from './mock/delivery-driver'
import { warehouseWorkerMock} from './mock/warehouse-worker'
import { forkliftOperatorMock} from './mock/forklift-operator'
import { packagerMock} from './mock/packager'
import { qualityAssuranceMock} from './mock/quality-assurance'
import { safetyInspectorMock} from './mock/safety-inspector'
import { environmentalComplianceMock} from './mock/environmental-compliance'
import { regulatoryAffairsMock} from './mock/regulatory-affairs'
import { contractManagerMock } from './mock/contract-manager'
import { procurementOfficerMock} from './mock/procurement-officer'
import { buyerMock} from './mock/buyer'
import { salesRepresentativeMock} from './mock/sales-representative'
            { key: 'resolved', value: 'resolved' },
            { key: 'inProgress', value: 'inProgress' },
            { key: 'pending', value: 'pending' }
          ],
          update: { updatedAt: '2024-03-30T18:00' }
        },
        {
          key: 'severity',
          label: '严重程度',
          type: 'select' as const,
          options: [
            { label: '全部', value: 'all' },
            { label: '一般隐患', value: 'minor' },
            { label: '较大隐患', value: 'major' },
            { label: '重大隐患', value: 'critical' }
          ],
          value: 'all',
          onChange: (value) => console.log('Severity:', value)
        }
      ]
    } sections={map((section, index) => (
      <div key={index} className="p-4">
        <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
        <div className="grid grid-cols-4 gap-4">
          {section.items.map((item, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{item.title}</h4>
                <span className={`text-sm px-2 py-1 rounded-full ${
                  item.status === 'resolved' ? 'bg-green-100 text-green-800' :
                  item.status === 'inProgress' ? 'bg-yellow-100 text-yellow-800' :
                  item.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.status === 'resolved' ? '已解决' : 
                   item.status === 'inProgress' ? '处理中' : 
                   item.status === 'pending' ? '待处理' : '新发现'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>📍 {item.location}</span>
                <span>👤 {item.reporter}</span>
                <span>📅 {item.date}</span>
              </div>
            </div>
          ))}
        </div>
      ))
    </PageShell>
  )
}
