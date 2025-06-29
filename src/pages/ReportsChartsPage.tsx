Here's the fixed version with all closing brackets added:

```javascript
                      <Bar data={teamProductivityChartData} options={chartOptions} />
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Distribuição de Carga de Trabalho
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>Colaboradores:</strong> {selectedAssigneesText}
                      </p>
                      <Pie data={teamWorkloadDistributionChartData} options={chartOptions} />
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Horas Alocadas por Colaborador
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>Colaboradores:</strong> {selectedAssigneesText}
                      </p>
                      <Bar data={teamHoursAllocatedChartData} options={chartOptions} />
                    </div>
                  </div>
                </div>

                {/* Weekly Comparison */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    📊 Comparação Semanal
                  </h3>
                  <div className="grid grid-cols-1 gap-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Comparação com a Semana Anterior
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>Período:</strong> {format(dateRange.startDate, 'dd/MM/yyyy')} a {format(dateRange.endDate, 'dd/MM/yyyy')}
                      </p>
                      <Bar data={weeklyComparisonChartData} options={stackedChartOptions} />
                    </div>
                  </div>
                </div>

                {/* Project Evolution */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    📈 Evolução dos Projetos
                  </h3>
                  <div className="grid grid-cols-1 gap-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        Progresso dos Projetos
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        <strong>Projetos:</strong> {selectedProjectsText}
                      </p>
                      <Bar data={projectEvolutionChartData} options={stackedChartOptions} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
```